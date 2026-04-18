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

const FORECAST_CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'weather_code',
  'wind_speed_10m',
  'is_day',
];

const AIR_QUALITY_CURRENT_FIELDS = ['pm10', 'pm2_5', 'european_aqi'];

@Injectable()
export class TodayWeatherClient {
  async searchLocation(locationQuery: string): Promise<GeocodingResult | null> {
    if (!locationQuery) {
      return null;
    }

    const response = await this.fetchJson<GeocodingResponse>(
      this.createGeocodingUrl(locationQuery),
    );
    return response.results?.[0] ?? null;
  }

  async getForecast(
    latitude: number,
    longitude: number,
  ): Promise<ForecastResponse> {
    return this.fetchJson<ForecastResponse>(
      this.createCurrentUrl(
        OPEN_METEO_FORECAST_ENDPOINT,
        latitude,
        longitude,
        FORECAST_CURRENT_FIELDS,
      ),
    );
  }

  async getAirQuality(
    latitude: number,
    longitude: number,
  ): Promise<AirQualityResponse> {
    return this.fetchJson<AirQualityResponse>(
      this.createCurrentUrl(
        OPEN_METEO_AIR_QUALITY_ENDPOINT,
        latitude,
        longitude,
        AIR_QUALITY_CURRENT_FIELDS,
      ),
    );
  }

  private createGeocodingUrl(locationQuery: string): URL {
    const url = new URL(OPEN_METEO_GEOCODING_ENDPOINT);
    url.searchParams.set('name', locationQuery);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'ko');
    return url;
  }

  // forecast / air-quality는 current 필드만 다르고
  // 나머지 쿼리 스켈레톤은 같아서 여기서 같이 조립한다.
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

  private async fetchJson<T>(url: URL): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
