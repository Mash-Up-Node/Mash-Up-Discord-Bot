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
} from '../interfaces/today-api.interface';

@Injectable()
export class TodayWeatherClient {
  // Open-Meteo 첫 번째 좌표 후보 검색
  async searchLocation(locationQuery: string): Promise<GeocodingResult | null> {
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

  // 현재 날씨 조회
  async getForecast(
    latitude: number,
    longitude: number,
  ): Promise<ForecastResponse> {
    return this.fetchJson<ForecastResponse>(
      this.createCurrentUrl(OPEN_METEO_FORECAST_ENDPOINT, latitude, longitude, [
        'temperature_2m',
        'apparent_temperature',
        'weather_code',
        'wind_speed_10m',
        'is_day',
      ]),
    );
  }

  // 현재 공기질 조회
  async getAirQuality(
    latitude: number,
    longitude: number,
  ): Promise<AirQualityResponse> {
    return this.fetchJson<AirQualityResponse>(
      this.createCurrentUrl(
        OPEN_METEO_AIR_QUALITY_ENDPOINT,
        latitude,
        longitude,
        ['pm10', 'pm2_5', 'european_aqi'],
      ),
    );
  }

  // 엔드포인트별 current 필드 구성
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

  // Open-Meteo JSON 응답 요청
  private async fetchJson<T>(url: URL): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
