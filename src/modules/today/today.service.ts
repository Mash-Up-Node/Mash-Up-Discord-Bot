import { Injectable } from '@nestjs/common';
import {
  FORTUNE_QUERIES,
  FortuneQuery,
  NAVER_FORTUNE_ENDPOINT,
  OPEN_METEO_AIR_QUALITY_ENDPOINT,
  OPEN_METEO_FORECAST_ENDPOINT,
  OPEN_METEO_GEOCODING_ENDPOINT,
} from './constants/today.constants';
import { LOCATION_ALIASES } from './constants/today.locations';
import {
  createFortuneFetchFailedMessage,
  createLocationNotFoundMessage,
  INVALID_FORTUNE_INPUT,
  INVALID_GENDER,
  WEATHER_FETCH_FAILED,
} from './constants/today.messages';
import { TodayFortune } from './types/today-fortune.type';
import { TodaySummary } from './types/today-summary.type';
import {
  AirQualityResponse,
  ForecastResponse,
  GeocodingResponse,
  GeocodingResult,
  NaverFortuneResponse,
} from './interfaces/today-api.interface';
import { parseFortuneInput } from './utils/fortune-input.util';
import { extractFortune, selectFortuneHtml } from './utils/naver-fortune.util';
import { parseJsonp } from './utils/naver-jsonp.util';
import { toTodaySummary } from './utils/weather-summary.util';

@Injectable()
export class TodayService {
  // 지역 좌표 해석 후 날씨/공기질 병렬 조회
  async getTodaySummary(location: string): Promise<TodaySummary> {
    const resolvedLocation = await this.resolveLocation(location);

    try {
      const [forecast, airQuality] = await Promise.all([
        this.fetchJson<ForecastResponse>(
          this.createForecastUrl(
            OPEN_METEO_FORECAST_ENDPOINT,
            resolvedLocation.latitude,
            resolvedLocation.longitude,
          ),
        ),
        this.fetchJson<AirQualityResponse>(
          this.createForecastUrl(
            OPEN_METEO_AIR_QUALITY_ENDPOINT,
            resolvedLocation.latitude,
            resolvedLocation.longitude,
          ),
        ),
      ]);

      if (!forecast.current || !airQuality.current) {
        throw new Error('Missing current payload');
      }

      return toTodaySummary(
        resolvedLocation,
        forecast.current,
        airQuality.current,
      );
    } catch {
      throw new Error(WEATHER_FETCH_FAILED);
    }
  }

  // 오늘 운세 쿼리 캡슐화
  async getTodayFortune(rawInput: string): Promise<TodayFortune> {
    return this.getFortune(rawInput, FORTUNE_QUERIES.TODAY);
  }

  // 내일 운세 쿼리 캡슐화
  async getTomorrowFortune(rawInput: string): Promise<TodayFortune> {
    return this.getFortune(rawInput, FORTUNE_QUERIES.TOMORROW);
  }

  // 네이버 요청 구성 및 공급자 오류 메시지 통합
  private async getFortune(
    rawInput: string,
    query: FortuneQuery,
  ): Promise<TodayFortune> {
    const parsedInput = parseFortuneInput(rawInput);
    const url = new URL(NAVER_FORTUNE_ENDPOINT);
    url.searchParams.set('where', 'nexearch');
    url.searchParams.set('pkid', '387');
    url.searchParams.set('_callback', 'fortuneCallback');
    url.searchParams.set('q', query);
    url.searchParams.set('u1', parsedInput.genderCode);
    url.searchParams.set('u2', parsedInput.birthDateCompact);
    url.searchParams.set('u3', 'solar');

    try {
      const response = await this.fetchText(url);
      const payload = parseJsonp<NaverFortuneResponse>(response);
      const html = selectFortuneHtml(payload, query);

      if (!html) {
        throw new Error('Missing fortune payload');
      }

      return extractFortune(
        html,
        parsedInput.genderLabel,
        parsedInput.birthDate,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === INVALID_FORTUNE_INPUT ||
          error.message === INVALID_GENDER)
      ) {
        throw error;
      }

      throw new Error(createFortuneFetchFailedMessage(query));
    }
  }

  // 한글 도시명 실패 시 영문 별칭 재시도
  private async resolveLocation(location: string): Promise<GeocodingResult> {
    try {
      const result =
        (await this.searchLocation(location)) ??
        (await this.searchLocation(LOCATION_ALIASES.get(location) ?? ''));

      if (!result) {
        throw new Error(createLocationNotFoundMessage(location));
      }

      return result;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('지역을 찾지 못했')
      ) {
        throw error;
      }

      throw new Error(WEATHER_FETCH_FAILED);
    }
  }

  // Open-Meteo 첫 번째 좌표 후보 검색
  private async searchLocation(
    locationQuery: string,
  ): Promise<GeocodingResult | null> {
    if (!locationQuery) {
      return null;
    }

    const url = new URL(OPEN_METEO_GEOCODING_ENDPOINT);
    url.searchParams.set('name', locationQuery);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'ko');

    const response = await this.fetchJson<GeocodingResponse>(url);
    return response.results?.[0] ?? null;
  }

  // 엔드포인트별 current 필드 구성
  private createForecastUrl(
    baseUrl: string,
    latitude: number,
    longitude: number,
  ): URL {
    const url = new URL(baseUrl);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('timezone', 'auto');

    if (baseUrl === OPEN_METEO_FORECAST_ENDPOINT) {
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

  // 메시지 매핑 분리를 위한 얇은 JSON 요청 헬퍼
  private async fetchJson<T>(url: URL): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  // 메시지 매핑 분리를 위한 얇은 텍스트 요청 헬퍼
  private async fetchText(url: URL): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Naver request failed: ${response.status}`);
    }

    return response.text();
  }
}
