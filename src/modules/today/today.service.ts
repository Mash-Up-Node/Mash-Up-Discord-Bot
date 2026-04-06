import { Injectable } from '@nestjs/common';
import { TodayFortune, TodaySummary } from './entities/today-summary.entity';

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country?: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
  };
}

interface AirQualityResponse {
  current?: {
    pm10: number;
    pm2_5: number;
    european_aqi: number;
  };
}

interface NaverFortuneResponse {
  flick?: string[];
}

@Injectable()
export class TodayService {
  private readonly geocodingEndpoint =
    'https://geocoding-api.open-meteo.com/v1/search';
  private readonly forecastEndpoint = 'https://api.open-meteo.com/v1/forecast';
  private readonly airQualityEndpoint =
    'https://air-quality-api.open-meteo.com/v1/air-quality';
  private readonly naverFortuneEndpoint =
    'https://ts-proxy.naver.com/content/apirender.nhn';

  async getTodaySummary(location: string): Promise<TodaySummary> {
    const resolvedLocation = await this.resolveLocation(location);

    try {
      const [forecast, airQuality] = await Promise.all([
        this.fetchJson<ForecastResponse>(
          this.createForecastUrl(
            this.forecastEndpoint,
            resolvedLocation.latitude,
            resolvedLocation.longitude,
          ),
        ),
        this.fetchJson<AirQualityResponse>(
          this.createForecastUrl(
            this.airQualityEndpoint,
            resolvedLocation.latitude,
            resolvedLocation.longitude,
          ),
        ),
      ]);

      if (!forecast.current || !airQuality.current) {
        throw new Error('Missing current payload');
      }

      return {
        locationName: this.formatLocationName(resolvedLocation),
        timezone: resolvedLocation.timezone,
        temperature: forecast.current.temperature_2m,
        apparentTemperature: forecast.current.apparent_temperature,
        weatherCode: forecast.current.weather_code,
        isDay: forecast.current.is_day === 1,
        windSpeed: forecast.current.wind_speed_10m,
        pm10: airQuality.current.pm10,
        pm2_5: airQuality.current.pm2_5,
        europeanAqi: airQuality.current.european_aqi,
      };
    } catch {
      throw new Error(
        '오늘 날씨 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  }

  async getTodayFortune(rawInput: string): Promise<TodayFortune> {
    return this.getFortune(rawInput, '생년월일 운세');
  }

  async getTomorrowFortune(rawInput: string): Promise<TodayFortune> {
    return this.getFortune(rawInput, '생년월일 내일 운세');
  }

  private async getFortune(
    rawInput: string,
    query: '생년월일 운세' | '생년월일 내일 운세',
  ): Promise<TodayFortune> {
    const parsedInput = this.parseFortuneInput(rawInput);
    const url = new URL(this.naverFortuneEndpoint);
    url.searchParams.set('where', 'nexearch');
    url.searchParams.set('pkid', '387');
    url.searchParams.set('_callback', 'fortuneCallback');
    url.searchParams.set('q', query);
    url.searchParams.set('u1', parsedInput.genderCode);
    url.searchParams.set('u2', parsedInput.birthDateCompact);
    url.searchParams.set('u3', 'solar');

    try {
      const response = await this.fetchText(url);
      const payload = this.parseJsonp<NaverFortuneResponse>(response);
      const html = this.selectFortuneHtml(payload, query);

      if (!html) {
        throw new Error('Missing fortune payload');
      }

      return this.extractFortune(
        html,
        parsedInput.genderLabel,
        parsedInput.birthDate,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('형식은') || error.message.includes('성별은'))
      ) {
        throw error;
      }

      throw new Error(
        `${query === '생년월일 내일 운세' ? '내일' : '오늘'} 운세 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`,
      );
    }
  }

  private async resolveLocation(location: string): Promise<GeocodingResult> {
    const url = new URL(this.geocodingEndpoint);
    url.searchParams.set('name', location);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'ko');

    try {
      const response = await this.fetchJson<GeocodingResponse>(url);
      const result = response.results?.[0];

      if (!result) {
        throw new Error(`${location} 지역을 찾지 못했습니다.`);
      }

      return result;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('지역을 찾지 못했')
      ) {
        throw error;
      }

      throw new Error(
        '오늘 날씨 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  }

  private createForecastUrl(
    baseUrl: string,
    latitude: number,
    longitude: number,
  ): URL {
    const url = new URL(baseUrl);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('timezone', 'auto');

    if (baseUrl === this.forecastEndpoint) {
      url.searchParams.set(
        'current',
        [
          'temperature_2m',
          'apparent_temperature',
          'weather_code',
          'wind_speed_10m',
          'is_day',
        ].join(','),
      );
      return url;
    }

    url.searchParams.set(
      'current',
      ['pm10', 'pm2_5', 'european_aqi'].join(','),
    );
    return url;
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private async fetchText(url: URL): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Naver request failed: ${response.status}`);
    }

    return response.text();
  }

  private parseFortuneInput(rawInput: string): {
    genderCode: 'm' | 'f';
    genderLabel: '남자' | '여자';
    birthDate: string;
    birthDateCompact: string;
  } {
    const [rawGender, rawBirthDate] = rawInput
      .split(',')
      .map((value) => value.trim());

    if (!rawGender || !rawBirthDate) {
      throw new Error('운세 형식은 "남자,2025-05-18" 입니다.');
    }

    const normalizedGender = rawGender.toLowerCase();
    const genderMap = new Map<
      string,
      { code: 'm' | 'f'; label: '남자' | '여자' }
    >([
      ['남자', { code: 'm', label: '남자' }],
      ['남', { code: 'm', label: '남자' }],
      ['m', { code: 'm', label: '남자' }],
      ['male', { code: 'm', label: '남자' }],
      ['여자', { code: 'f', label: '여자' }],
      ['여', { code: 'f', label: '여자' }],
      ['f', { code: 'f', label: '여자' }],
      ['female', { code: 'f', label: '여자' }],
    ]);
    const gender = genderMap.get(normalizedGender);

    if (!gender) {
      throw new Error('성별은 남자 또는 여자로 입력해주세요.');
    }

    const birthDateCompact = rawBirthDate.replace(/-/g, '');

    if (!/^\d{8}$/.test(birthDateCompact)) {
      throw new Error('생년월일 형식은 YYYY-MM-DD 입니다.');
    }

    return {
      genderCode: gender.code,
      genderLabel: gender.label,
      birthDate: `${birthDateCompact.slice(0, 4)}-${birthDateCompact.slice(4, 6)}-${birthDateCompact.slice(6, 8)}`,
      birthDateCompact,
    };
  }

  private parseJsonp<T>(responseText: string): T {
    const match = responseText.match(/^[^(]+\(([\s\S]*)\);\s*$/);

    if (!match) {
      throw new Error('Invalid JSONP response');
    }

    return JSON.parse(match[1]) as T;
  }

  private selectFortuneHtml(
    payload: NaverFortuneResponse,
    query: '생년월일 운세' | '생년월일 내일 운세',
  ): string | undefined {
    const panels = payload.flick ?? [];

    if (query === '생년월일 내일 운세') {
      return panels[1] ?? panels[0];
    }

    return panels[0];
  }

  private extractFortune(
    html: string,
    gender: '남자' | '여자',
    birthDate: string,
  ): TodayFortune {
    const keywordMatch = html.match(
      /<strong>운세의 총운은\s*<b>(.*?)<\/b>\s*입니다<\/strong>/,
    );
    const dateMatch = html.match(/<span class="result_date">(.*?)<\/span>/);
    const summaryMatch = html.match(
      /<dt class="blind">총운<\/dt>\s*<dd>[\s\S]*?<p>([\s\S]*?)<\/p>/,
    );

    if (!keywordMatch || !dateMatch || !summaryMatch) {
      throw new Error('Failed to parse fortune HTML');
    }

    return {
      keyword: this.stripHtml(keywordMatch[1]),
      date: this.stripHtml(dateMatch[1]),
      summary: this.stripHtml(summaryMatch[1]),
      gender,
      birthDate,
    };
  }

  private stripHtml(input: string): string {
    return input
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatLocationName(location: GeocodingResult): string {
    const parts = [location.name];

    if (location.admin1 && location.admin1 !== location.name) {
      parts.push(location.admin1);
    }

    if (location.country) {
      parts.push(location.country);
    }

    return parts.join(', ');
  }
}
