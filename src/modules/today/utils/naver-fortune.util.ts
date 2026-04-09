import { FortuneQuery, FORTUNE_QUERIES } from '../constants/today.constants';
import { TodayFortune } from '../types/today-fortune.type';
import { NaverFortuneResponse } from '../interfaces/today-api.interface';

// 공급자 HTML의 일반 텍스트 정리
function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// flick 배열의 오늘/내일 운세 패널 선택
export function selectFortuneHtml(
  payload: NaverFortuneResponse,
  query: FortuneQuery,
): string | undefined {
  const panels = payload.flick ?? [];

  if (query === FORTUNE_QUERIES.TOMORROW) {
    return panels[1] ?? panels[0];
  }

  return panels[0];
}

// 공급자 HTML 조각의 노출 필드 추출
export function extractFortune(
  html: string,
  gender: '남자' | '여자',
  birthDate: string,
): TodayFortune {
  const keywordMatch = html.match(
    /<strong>운세의 총운은\s*<b>(.*?)<\/b>\s*입니다<\/strong>/,
  );
  const dateMatch = html.match(/<span class="result_date">(.*?)<\/span>/);
  const summaryMatch = html.match(
    /<dt class="blind">총운<\/dt>\s*<dd>[\s\S]*?<p>([\s\S]*?)<\/p>/,
  );

  if (!keywordMatch || !dateMatch || !summaryMatch) {
    throw new Error('Failed to parse fortune HTML');
  }

  return {
    keyword: stripHtml(keywordMatch[1]),
    date: stripHtml(dateMatch[1]),
    summary: stripHtml(summaryMatch[1]),
    gender,
    birthDate,
  };
}
