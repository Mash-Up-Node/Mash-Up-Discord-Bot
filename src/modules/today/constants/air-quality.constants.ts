export interface AirQualityBand {
  max: number;
  label: string;
  advices: string[];
}

export interface DustBand {
  max: number;
  label: string;
}

export const EUROPEAN_AQI_BANDS: AirQualityBand[] = [
  {
    max: 20,
    label: '좋음',
    advices: ['야외 활동 무난해요.', '가볍게 바깥 활동하기 좋은 공기질이에요.'],
  },
  {
    max: 40,
    label: '양호',
    advices: [
      '대체로 무난하지만 민감하면 마스크를 챙기세요.',
      '대부분 괜찮지만 민감하다면 마스크를 챙기는 편이 좋아요.',
    ],
  },
  {
    max: 60,
    label: '보통',
    advices: [
      '민감군은 마스크를 권장해요.',
      '공기질이 무난한 편은 아니어서 민감군은 대비가 필요해요.',
    ],
  },
  {
    max: 80,
    label: '나쁨',
    advices: [
      '마스크를 권장하고 오래 머무는 야외 활동은 줄이세요.',
      '야외 체류 시간을 줄이고 마스크를 챙기는 편이 좋아요.',
    ],
  },
  {
    max: 100,
    label: '매우 나쁨',
    advices: [
      '마스크가 사실상 필수예요.',
      '외출 시 마스크를 꼭 챙기고 장시간 야외 활동은 피하세요.',
    ],
  },
  {
    max: Number.POSITIVE_INFINITY,
    label: '위험',
    advices: [
      '마스크 필수, 외출은 최소화하는 편이 좋아요.',
      '가급적 실내에 머물고 외출이 필요하면 보호 장비를 챙기세요.',
    ],
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
