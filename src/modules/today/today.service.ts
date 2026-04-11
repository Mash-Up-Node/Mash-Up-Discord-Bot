import { Injectable } from '@nestjs/common';
import { FORTUNE_QUERIES, FortuneQuery } from './constants/today.constants';
import { TodayFortuneClient } from './clients/today-fortune.client';
import { TodayWeatherClient } from './clients/today-weather.client';
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
  GeocodingResult,
  NaverFortuneResponse,
} from './interfaces/today-api.interface';
import { parseFortuneInput } from './utils/fortune-input.util';
import { extractFortune, selectFortuneHtml } from './utils/naver-fortune.util';
import { parseJsonp } from './utils/naver-jsonp.util';
import { toTodaySummary } from './utils/weather-summary.util';

class LocationNotFoundError extends Error {
  constructor(location: string) {
    super(createLocationNotFoundMessage(location));
    this.name = 'LocationNotFoundError';
  }
}

@Injectable()
export class TodayService {
  constructor(
    private readonly weatherClient: TodayWeatherClient,
    private readonly fortuneClient: TodayFortuneClient,
  ) {}

  // 지역 좌표 해석 후 날씨/공기질 병렬 조회
  async getTodaySummary(location: string): Promise<TodaySummary> {
    const resolvedLocation = await this.resolveLocation(location);

    try {
      const [forecast, airQuality] = await Promise.all([
        this.weatherClient.getForecast(
          resolvedLocation.latitude,
          resolvedLocation.longitude,
        ),
        this.weatherClient.getAirQuality(
          resolvedLocation.latitude,
          resolvedLocation.longitude,
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

    try {
      const response = await this.fortuneClient.fetchFortuneResponse(
        query,
        parsedInput,
      );
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

  // 원본 입력 실패 시 영문 별칭 재시도
  private async resolveLocation(location: string): Promise<GeocodingResult> {
    try {
      const result =
        (await this.weatherClient.searchLocation(location)) ??
        (await this.weatherClient.searchLocation(
          LOCATION_ALIASES.get(location) ?? '',
        ));

      if (!result) {
        throw new LocationNotFoundError(location);
      }

      return result;
    } catch (error) {
      if (error instanceof LocationNotFoundError) {
        throw error;
      }

      throw new Error(WEATHER_FETCH_FAILED);
    }
  }
}
