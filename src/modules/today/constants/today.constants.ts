export const DEFAULT_LOCATION = '서울';

export const OPEN_METEO_GEOCODING_ENDPOINT =
  'https://geocoding-api.open-meteo.com/v1/search';
export const OPEN_METEO_FORECAST_ENDPOINT =
  'https://api.open-meteo.com/v1/forecast';
export const OPEN_METEO_AIR_QUALITY_ENDPOINT =
  'https://air-quality-api.open-meteo.com/v1/air-quality';
export const NAVER_FORTUNE_ENDPOINT =
  'https://ts-proxy.naver.com/content/apirender.nhn';

export const FORTUNE_QUERIES = {
  TODAY: '생년월일 운세',
  TOMORROW: '생년월일 내일 운세',
} as const;

export type FortuneQuery =
  (typeof FORTUNE_QUERIES)[keyof typeof FORTUNE_QUERIES];
