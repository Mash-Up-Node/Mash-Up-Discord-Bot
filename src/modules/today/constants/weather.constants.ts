export const RAINY_WEATHER_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

export const SNOWY_WEATHER_CODES = new Set([71, 73, 75, 77, 85, 86]);
export const FOGGY_WEATHER_CODES = new Set([45, 48]);

export const WEATHER_ADVICE_MESSAGES = {
  RAIN: [
    '우산 안 챙기면 오늘 좀 억울할 수 있어요 ☔',
    '우산 챙기세요 ☔',
    '뭔가 잊으시지 않았나요? 우산이요 ☔',
  ],
  SNOW: [
    '따뜻하게 입고, 눈길 미끄럼은 꼭 조심하세요 ❄️',
    '발밑 조심 모드예요 ❄️',
    '눈사람 만들러 갑시다 ☃️ ',
  ],
  FOG: [
    '안개 때문에 앞이 좀 답답할 수 있어요 🌫️',
    '앞을 한 번 더 확인하고 가세요 👀',
  ],
  WIND: [
    '바람이 꽤 있어서 숫자보다 더 쌀쌀하게 느껴질 수 있어요 💨',
    '바람맛 좀 있는 날이에요 💨',
    '바람과 태양이 싸우는 날이예요 🌬️',
  ],
} as const;
