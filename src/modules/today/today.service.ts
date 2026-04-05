import { Injectable } from '@nestjs/common';
import { TodaySummary } from './entities/today-summary.entity';

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

@Injectable()
export class TodayService {
  private readonly geocodingEndpoint =
    'https://geocoding-api.open-meteo.com/v1/search';
  private readonly forecastEndpoint = 'https://api.open-meteo.com/v1/forecast';
  private readonly airQualityEndpoint =
    'https://air-quality-api.open-meteo.com/v1/air-quality';

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
