export const RAINY_WEATHER_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

export const SNOWY_WEATHER_CODES = new Set([71, 73, 75, 77, 85, 86]);
export const FOGGY_WEATHER_CODES = new Set([45, 48]);

export const WEATHER_ADVICE_MESSAGES = {
  RAIN: ['우산 챙기세요.', '비 예보가 있으니 방수 신발이면 더 좋아요.'],
  SNOW: [
    '방한 준비를 하고 길 미끄럼을 주의하세요.',
    '눈길에 대비해서 따뜻한 옷차림과 미끄럼 주의를 챙기세요.',
  ],
  FOG: [
    '안개로 시야가 답답할 수 있어요.',
    '안개 때문에 이동 시 시야 확보에 신경 쓰세요.',
  ],
  WIND: [
    '바람이 강해서 체감이 더 낮을 수 있어요.',
    '바람이 강하니 체감온도에 맞춰 옷차림을 준비하세요.',
  ],
} as const;
