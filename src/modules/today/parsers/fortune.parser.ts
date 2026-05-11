import { FORTUNE_QUERIES, FortuneQuery } from '../constants/today.constants';
import { INVALID_BIRTH_DATE } from '../constants/today.messages';
import { NaverFortuneResponse } from '../clients/types/today-api.type';
import { FortuneGenderInput } from '../dto/today-fortune-query.dto';
import { TodayFortune } from '../types/today-fortune.type';

export interface ParsedFortuneInput {
  genderCode: 'm' | 'f';
  genderLabel: '남자' | '여자';
  birthDate: string;
  birthDateCompact: string;
}

const GENDER_MAP: Record<
  FortuneGenderInput,
  { code: 'm' | 'f'; label: '남자' | '여자' }
> = {
  male: { code: 'm', label: '남자' },
  female: { code: 'f', label: '여자' },
};

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

export function buildFortuneInput(
  gender: FortuneGenderInput,
  rawBirthDate: string,
): ParsedFortuneInput {
  const birthDateCompact = rawBirthDate.trim().replace(/-/g, '');

  if (!/^\d{8}$/.test(birthDateCompact)) {
    throw new Error(INVALID_BIRTH_DATE);
  }

  const { code, label } = GENDER_MAP[gender];

  return {
    genderCode: code,
    genderLabel: label,
    birthDate: `${birthDateCompact.slice(0, 4)}-${birthDateCompact.slice(4, 6)}-${birthDateCompact.slice(6, 8)}`,
    birthDateCompact,
  };
}

function parseJsonp<T>(responseText: string): T {
  const match = responseText.match(/^[^(]+\(([\s\S]*)\);\s*$/);

  if (!match) {
    throw new Error('Invalid JSONP response');
  }

  return JSON.parse(match[1]) as T;
}

function selectFortuneHtml(
  payload: NaverFortuneResponse,
  query: FortuneQuery,
): string | undefined {
  const panels = payload.flick ?? [];

  // 네이버 flick 배열은 보통 [오늘, 내일] 순서
  if (query === FORTUNE_QUERIES.TOMORROW) {
    return panels[1];
  }

  return panels[0];
}

function extractFortune(
  html: string,
  gender: '남자' | '여자',
  birthDate: string,
): TodayFortune {
  // 네이버 운세 HTML 마크업 계약에 의존해 필요한 필드를 추출한다.
  // 공급자 마크업이 바뀌면 여기서 파싱이 깨지고 상위 service가 공통 에러로 감싼다.
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

export function parseFortuneResponse(
  responseText: string,
  query: FortuneQuery,
  input: ParsedFortuneInput,
): TodayFortune {
  const payload = parseJsonp<NaverFortuneResponse>(responseText);
  const html = selectFortuneHtml(payload, query);

  if (!html) {
    throw new Error('Missing fortune payload');
  }

  return extractFortune(html, input.genderLabel, input.birthDate);
}
