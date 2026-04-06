import { TodayFortune, TodaySummary } from '../entities/today-summary.entity';

export function formatWeatherCode(weatherCode: number, isDay: boolean): string {
  switch (weatherCode) {
    case 0:
      return isDay ? '맑음' : '맑은 밤';
    case 1:
      return isDay ? '대체로 맑음' : '대체로 맑은 밤';
    case 2:
      return '부분적으로 흐림';
    case 3:
      return '흐림';
    case 45:
    case 48:
      return '안개';
    case 51:
    case 53:
    case 55:
      return '이슬비';
    case 56:
    case 57:
      return '어는 이슬비';
    case 61:
    case 63:
    case 65:
      return '비';
    case 66:
    case 67:
      return '어는 비';
    case 71:
    case 73:
    case 75:
    case 77:
      return '눈';
    case 80:
    case 81:
    case 82:
      return '소나기';
    case 85:
    case 86:
      return '눈 소나기';
    case 95:
    case 96:
    case 99:
      return '뇌우';
    default:
      return '알 수 없음';
  }
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
