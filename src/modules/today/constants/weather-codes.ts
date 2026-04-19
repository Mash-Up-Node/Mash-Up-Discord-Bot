export interface WeatherCodeLabel {
  day: string;
  night?: string;
}

export const WEATHER_CODE_LABELS: Record<number, WeatherCodeLabel> = {
  0: { day: '맑음', night: '맑은 밤' },
  1: { day: '대체로 맑음', night: '대체로 맑은 밤' },
  2: { day: '부분적으로 흐림' },
  3: { day: '흐림' },
  45: { day: '안개' },
  48: { day: '안개' },
  51: { day: '이슬비' },
  53: { day: '이슬비' },
  55: { day: '이슬비' },
  56: { day: '어는 이슬비' },
  57: { day: '어는 이슬비' },
  61: { day: '비' },
  63: { day: '비' },
  65: { day: '비' },
  66: { day: '어는 비' },
  67: { day: '어는 비' },
  71: { day: '눈' },
  73: { day: '눈' },
  75: { day: '눈' },
  77: { day: '눈' },
  80: { day: '소나기' },
  81: { day: '소나기' },
  82: { day: '소나기' },
  85: { day: '눈 소나기' },
  86: { day: '눈 소나기' },
  95: { day: '뇌우' },
  96: { day: '뇌우' },
  99: { day: '뇌우' },
};
