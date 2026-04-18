import {
  EUROPEAN_AQI_BANDS,
  PM10_BANDS,
  PM2_5_BANDS,
} from '../constants/air-quality.constants';
import {
  FOGGY_WEATHER_CODES,
  RAINY_WEATHER_CODES,
  SNOWY_WEATHER_CODES,
  WEATHER_ADVICE_MESSAGES,
} from '../constants/weather-advice.constants';
import { WEATHER_CODE_LABELS } from '../constants/weather-codes';
import { TodaySummary } from '../types/today-summary.type';

type RandomSource = () => number;

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

function getAirQualityBand(aqi: number) {
  return (
    EUROPEAN_AQI_BANDS.find((band) => aqi <= band.max) ??
    EUROPEAN_AQI_BANDS[EUROPEAN_AQI_BANDS.length - 1]
  );
}

function getDustBand(
  value: number,
  bands: Array<{ max: number; label: string }>,
): string {
  return (
    bands.find((band) => value <= band.max)?.label ??
    bands[bands.length - 1].label
  );
}

function pickRandom<T>(candidates: readonly T[], random: RandomSource): T {
  return candidates[Math.floor(random() * candidates.length)];
}

function createWeatherAdvice(
  summary: TodaySummary,
  random: RandomSource,
): string[] {
  const tips: string[] = [];

  // AQI 기반 기본 안내 외에 현재 날씨 상황에 맞는 생활 팁을 덧붙인다.
  if (RAINY_WEATHER_CODES.has(summary.weatherCode)) {
    tips.push(pickRandom(WEATHER_ADVICE_MESSAGES.RAIN, random));
  }

  if (SNOWY_WEATHER_CODES.has(summary.weatherCode)) {
    tips.push(pickRandom(WEATHER_ADVICE_MESSAGES.SNOW, random));
  }

  if (FOGGY_WEATHER_CODES.has(summary.weatherCode)) {
    tips.push(pickRandom(WEATHER_ADVICE_MESSAGES.FOG, random));
  }

  if (summary.windSpeed >= 20) {
    tips.push(pickRandom(WEATHER_ADVICE_MESSAGES.WIND, random));
  }

  return tips;
}

export function formatTodaySummary(
  summary: TodaySummary,
  random: RandomSource = Math.random,
): string {
  // random 주입을 열어둬서 테스트에서는 고정된 문구를 검증할 수 있게 한다.
  const airQuality = getAirQualityBand(summary.europeanAqi);
  const pm10Label = getDustBand(summary.pm10, PM10_BANDS);
  const pm2_5Label = getDustBand(summary.pm2_5, PM2_5_BANDS);
  const lifestyleTips = [
    pickRandom(airQuality.advices, random),
    ...createWeatherAdvice(summary, random),
  ];

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
