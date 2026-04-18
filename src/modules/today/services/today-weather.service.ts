import { Injectable } from '@nestjs/common';
import { TodayWeatherClient } from '../clients/today-weather.client';
import { LOCATION_ALIASES } from '../constants/today.locations';
import {
  createLocationNotFoundMessage,
  WEATHER_FETCH_FAILED,
} from '../constants/today.messages';
import {
  AirQualityCurrent,
  ForecastCurrent,
  GeocodingResult,
} from '../clients/types/today-api.type';
import { TodaySummary } from '../types/today-summary.type';

class LocationNotFoundError extends Error {
  constructor(location: string) {
    super(createLocationNotFoundMessage(location));
    this.name = 'LocationNotFoundError';
  }
}

@Injectable()
export class TodayWeatherService {
  constructor(private readonly weatherClient: TodayWeatherClient) {}

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

      return this.toTodaySummary(
        resolvedLocation,
        forecast.current,
        airQuality.current,
      );
    } catch {
      throw new Error(WEATHER_FETCH_FAILED);
    }
  }

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

  private toTodaySummary(
    location: GeocodingResult,
    forecast: ForecastCurrent,
    airQuality: AirQualityCurrent,
  ): TodaySummary {
    return {
      locationName: this.formatLocationName(location),
      timezone: location.timezone,
      temperature: forecast.temperature_2m,
      apparentTemperature: forecast.apparent_temperature,
      weatherCode: forecast.weather_code,
      isDay: forecast.is_day === 1,
      windSpeed: forecast.wind_speed_10m,
      pm10: airQuality.pm10,
      pm2_5: airQuality.pm2_5,
      europeanAqi: airQuality.european_aqi,
    };
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
