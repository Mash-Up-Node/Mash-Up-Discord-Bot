import { TodaySummary } from '../entities/today-summary.entity';
import {
  AirQualityCurrent,
  ForecastCurrent,
  GeocodingResult,
} from '../interfaces/today-api.interface';
import { formatLocationName } from './location-name.util';

export function toTodaySummary(
  location: GeocodingResult,
  forecast: ForecastCurrent,
  airQuality: AirQualityCurrent,
): TodaySummary {
  return {
    locationName: formatLocationName(location),
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
