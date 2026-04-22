export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country?: string;
  admin1?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

export interface ForecastCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  is_day: number;
  wind_speed_10m: number;
}

export interface ForecastResponse {
  current?: ForecastCurrent;
}

export interface AirQualityCurrent {
  pm10: number;
  pm2_5: number;
  european_aqi: number;
}

export interface AirQualityResponse {
  current?: AirQualityCurrent;
}

export interface NaverFortuneResponse {
  flick?: string[];
}
