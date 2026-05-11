import { FORTUNE_QUERIES, FortuneQuery } from './today.constants';

export const TODAY_COMMAND_FAILED = '오늘 정보를 가져오지 못했습니다.';
export const WEATHER_FETCH_FAILED =
  '오늘 날씨 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.';
export const INVALID_BIRTH_DATE =
  '생년월일은 YYYY-MM-DD 형식으로 입력해주세요. (예: 1995-05-18)';

export function createLocationNotFoundMessage(location: string): string {
  return `${location} 지역을 찾지 못했습니다.`;
}

export function createFortuneFetchFailedMessage(query: FortuneQuery): string {
  return `${query === FORTUNE_QUERIES.TOMORROW ? '내일' : '오늘'} 운세 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`;
}
