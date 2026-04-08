import { WEATHER_CODE_LABELS } from '../constants/weather-codes';
import { TodayFortune } from '../entities/today-fortune.entity';
import { TodaySummary } from '../entities/today-summary.entity';

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

export function formatTodaySummary(summary: TodaySummary): string {
  return [
    `**${summary.locationName} 현재 정보**`,
    `날씨: ${formatWeatherCode(summary.weatherCode, summary.isDay)}`,
    `기온: ${formatNumber(summary.temperature)}°C`,
    `체감: ${formatNumber(summary.apparentTemperature)}°C`,
    `풍속: ${formatNumber(summary.windSpeed)}km/h`,
    `미세먼지(PM10): ${formatNumber(summary.pm10)}μg/m³`,
    `초미세먼지(PM2.5): ${formatNumber(summary.pm2_5)}μg/m³`,
    `대기질 지수(European AQI): ${formatNumber(summary.europeanAqi)}`,
    `시간대: ${summary.timezone}`,
  ].join('\n');
}

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
