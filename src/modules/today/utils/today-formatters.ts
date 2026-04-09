import {
  EUROPEAN_AQI_BANDS,
  FOGGY_WEATHER_CODES,
  PM10_BANDS,
  PM2_5_BANDS,
  RAINY_WEATHER_CODES,
  SNOWY_WEATHER_CODES,
} from '../constants/air-quality.constants';
import { WEATHER_ADVICE_MESSAGES } from '../constants/today.messages';
import { WEATHER_CODE_LABELS } from '../constants/weather-codes';
import { TodayFortune } from '../types/today-fortune.type';
import { TodaySummary } from '../types/today-summary.type';

// Open-Meteo 날씨 코드의 사용자용 라벨 변환
export function formatWeatherCode(weatherCode: number, isDay: boolean): string {
  const label = WEATHER_CODE_LABELS[weatherCode];

  if (!label) {
    return '알 수 없음';
  }

  return isDay ? label.day : (label.night ?? label.day);
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// AQI 구간 탐색 및 등급/안내 재사용
function getAirQualityBand(aqi: number) {
  return (
    EUROPEAN_AQI_BANDS.find((band) => aqi <= band.max) ??
    EUROPEAN_AQI_BANDS[EUROPEAN_AQI_BANDS.length - 1]
  );
}

// PM10/PM2.5 공통 구간 라벨 탐색
function getDustBand(
  value: number,
  bands: Array<{ max: number; label: string }>,
): string {
  return (
    bands.find((band) => value <= band.max)?.label ??
    bands[bands.length - 1].label
  );
}

// 공기질 기본 안내 위의 날씨 상황별 안내 추가
function createWeatherAdvice(summary: TodaySummary): string[] {
  const tips: string[] = [];

  if (RAINY_WEATHER_CODES.has(summary.weatherCode)) {
    tips.push(WEATHER_ADVICE_MESSAGES.RAIN);
  }

  if (SNOWY_WEATHER_CODES.has(summary.weatherCode)) {
    tips.push(WEATHER_ADVICE_MESSAGES.SNOW);
  }

  if (FOGGY_WEATHER_CODES.has(summary.weatherCode)) {
    tips.push(WEATHER_ADVICE_MESSAGES.FOG);
  }

  if (summary.windSpeed >= 20) {
    tips.push(WEATHER_ADVICE_MESSAGES.WIND);
  }

  return tips;
}

// 날씨 조회 결과의 디스코드 메시지 요약 변환
export function formatTodaySummary(summary: TodaySummary): string {
  const airQuality = getAirQualityBand(summary.europeanAqi);
  const pm10Label = getDustBand(summary.pm10, PM10_BANDS);
  const pm2_5Label = getDustBand(summary.pm2_5, PM2_5_BANDS);
  const lifestyleTips = [airQuality.advice, ...createWeatherAdvice(summary)];

  return [
    `**${summary.locationName}**`,
    `현재 날씨: ${formatWeatherCode(summary.weatherCode, summary.isDay)}`,
    `기온 ${formatNumber(summary.temperature)}°C · 체감 ${formatNumber(summary.apparentTemperature)}°C · 바람 ${formatNumber(summary.windSpeed)}km/h`,
    '',
    `공기질: ${airQuality.label} (AQI ${formatNumber(summary.europeanAqi)})`,
    `미세먼지: ${pm10Label} (PM10 ${formatNumber(summary.pm10)}μg/m³)`,
    `초미세먼지: ${pm2_5Label} (PM2.5 ${formatNumber(summary.pm2_5)}μg/m³)`,
    '',
    `한줄 팁: ${lifestyleTips.join(' ')}`,
    `시간대: ${summary.timezone}`,
  ].join('\n');
}

// 오늘/내일 운세 공통 메시지 렌더링
export function formatTodayFortune(
  fortune: TodayFortune,
  title = '오늘의 운세',
): string {
  return [
    `**${title}**`,
    `입력: ${fortune.gender} / ${fortune.birthDate}`,
    `총운 키워드: ${fortune.keyword}`,
    `기준일: ${fortune.date}`,
    `총운: ${fortune.summary}`,
  ].join('\n');
}
