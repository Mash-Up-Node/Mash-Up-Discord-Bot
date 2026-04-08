import { FORTUNE_QUERIES, FortuneQuery } from './today.constants';

export const TODAY_COMMAND_FAILED = '오늘 정보를 가져오지 못했습니다.';
export const WEATHER_FETCH_FAILED =
  '오늘 날씨 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.';
export const INVALID_FORTUNE_INPUT = '운세 형식은 "남자,2025-05-18" 입니다.';
export const INVALID_GENDER = '성별은 남자 또는 여자로 입력해주세요.';
export const INVALID_BIRTH_DATE = '생년월일 형식은 YYYY-MM-DD 입니다.';

export const WEATHER_ADVICE_MESSAGES = {
  RAIN: '우산 챙기세요.',
  SNOW: '방한 준비를 하고 길 미끄럼을 주의하세요.',
  FOG: '안개로 시야가 답답할 수 있어요.',
  WIND: '바람이 강해서 체감이 더 낮을 수 있어요.',
} as const;

export function createLocationNotFoundMessage(location: string): string {
  return `${location} 지역을 찾지 못했습니다.`;
}

export function createFortuneFetchFailedMessage(query: FortuneQuery): string {
  return `${query === FORTUNE_QUERIES.TOMORROW ? '내일' : '오늘'} 운세 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`;
}
