export interface AirQualityBand {
  max: number;
  label: string;
  advice: string;
}

export interface DustBand {
  max: number;
  label: string;
}

export const EUROPEAN_AQI_BANDS: AirQualityBand[] = [
  { max: 20, label: '좋음', advice: '야외 활동 무난해요.' },
  {
    max: 40,
    label: '양호',
    advice: '대체로 무난하지만 민감하면 마스크를 챙기세요.',
  },
  { max: 60, label: '보통', advice: '민감군은 마스크를 권장해요.' },
  {
    max: 80,
    label: '나쁨',
    advice: '마스크를 권장하고 오래 머무는 야외 활동은 줄이세요.',
  },
  { max: 100, label: '매우 나쁨', advice: '마스크가 사실상 필수예요.' },
  {
    max: Number.POSITIVE_INFINITY,
    label: '위험',
    advice: '마스크 필수, 외출은 최소화하는 편이 좋아요.',
  },
];

export const PM10_BANDS: DustBand[] = [
  { max: 30, label: '좋음' },
  { max: 80, label: '보통' },
  { max: 150, label: '나쁨' },
  { max: Number.POSITIVE_INFINITY, label: '매우 나쁨' },
];

export const PM2_5_BANDS: DustBand[] = [
  { max: 15, label: '좋음' },
  { max: 35, label: '보통' },
  { max: 75, label: '나쁨' },
  { max: Number.POSITIVE_INFINITY, label: '매우 나쁨' },
];

export const RAINY_WEATHER_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

export const SNOWY_WEATHER_CODES = new Set([71, 73, 75, 77, 85, 86]);
export const FOGGY_WEATHER_CODES = new Set([45, 48]);
