import { Injectable } from '@nestjs/common';
import {
  OPEN_METEO_AIR_QUALITY_ENDPOINT,
  OPEN_METEO_FORECAST_ENDPOINT,
  OPEN_METEO_GEOCODING_ENDPOINT,
} from '../constants/today.constants';
import {
  AirQualityResponse,
  ForecastResponse,
  GeocodingResponse,
  GeocodingResult,
} from './types/today-api.type';

// Open-Meteo forecast API의 current 파라미터에 넣는 필드 목록
// 오늘 요약 메시지에 필요한 현재 기상 정보만 요청
const FORECAST_CURRENT_FIELDS = [
  'temperature_2m', // 지상 2m 기준 현재 기온
  'apparent_temperature', // 바람/습도 등을 반영한 체감 온도
  'weather_code', // Open-Meteo 표준 날씨 상태 코드
  'wind_speed_10m', // 지상 10m 기준 현재 풍속
  'is_day', // 주간(1) / 야간(0) 여부
];

// Open-Meteo air-quality API의 current 파라미터에 넣는 필드 목록
// 공기질 등급 계산과 안내 문구에 필요한 값만 요청
const AIR_QUALITY_CURRENT_FIELDS = [
  'pm10', // 미세먼지 농도
  'pm2_5', // 초미세먼지 농도
  'european_aqi', // 유럽 AQI 기준 공기질 지수
];

@Injectable()
export class TodayWeatherClient {
  async searchLocation(locationQuery: string): Promise<GeocodingResult | null> {
    if (!locationQuery) {
      return null;
    }

    const geocodingUrl = new URL(OPEN_METEO_GEOCODING_ENDPOINT);
    geocodingUrl.searchParams.set('name', locationQuery);
    geocodingUrl.searchParams.set('count', '1');
    geocodingUrl.searchParams.set('language', 'ko');

    const geocodingResponse = await fetch(geocodingUrl);

    if (!geocodingResponse.ok) {
      throw new Error(`Open-Meteo request failed: ${geocodingResponse.status}`);
    }

    const data = (await geocodingResponse.json()) as GeocodingResponse;
    return data.results?.[0] ?? null;
  }

  async getForecast(
    latitude: number,
    longitude: number,
  ): Promise<ForecastResponse> {
    const forecastUrl = this.createCurrentUrl(
      OPEN_METEO_FORECAST_ENDPOINT,
      latitude,
      longitude,
      FORECAST_CURRENT_FIELDS,
    );
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      throw new Error(`Open-Meteo request failed: ${forecastResponse.status}`);
    }

    return (await forecastResponse.json()) as ForecastResponse;
  }

  async getAirQuality(
    latitude: number,
    longitude: number,
  ): Promise<AirQualityResponse> {
    const airQualityUrl = this.createCurrentUrl(
      OPEN_METEO_AIR_QUALITY_ENDPOINT,
      latitude,
      longitude,
      AIR_QUALITY_CURRENT_FIELDS,
    );
    const airQualityResponse = await fetch(airQualityUrl);

    if (!airQualityResponse.ok) {
      throw new Error(
        `Open-Meteo request failed: ${airQualityResponse.status}`,
      );
    }

    return (await airQualityResponse.json()) as AirQualityResponse;
  }

  // forecast / air-quality는 current 필드만 다르고
  // 나머지 쿼리 스켈레톤은 같아서 여기서 같이 조립
  private createCurrentUrl(
    baseUrl: string,
    latitude: number,
    longitude: number,
    currentFields: string[],
  ): URL {
    const url = new URL(baseUrl);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('current', currentFields.join(','));
    return url;
  }
}
