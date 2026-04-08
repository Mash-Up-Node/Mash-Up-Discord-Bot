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
import { TodayFortune } from './entities/today-fortune.entity';
import { TodaySummary } from './entities/today-summary.entity';
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

  async getTodayFortune(rawInput: string): Promise<TodayFortune> {
    return this.getFortune(rawInput, FORTUNE_QUERIES.TODAY);
  }

  async getTomorrowFortune(rawInput: string): Promise<TodayFortune> {
    return this.getFortune(rawInput, FORTUNE_QUERIES.TOMORROW);
  }

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
}
