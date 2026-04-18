import { FORTUNE_QUERIES, FortuneQuery } from '../constants/today.constants';
import {
  INVALID_BIRTH_DATE,
  INVALID_FORTUNE_INPUT,
  INVALID_GENDER,
} from '../constants/today.messages';
import { NaverFortuneResponse } from '../clients/types/today-api.type';
import { TodayFortune } from '../types/today-fortune.type';

export interface ParsedFortuneInput {
  genderCode: 'm' | 'f';
  genderLabel: '남자' | '여자';
  birthDate: string;
  birthDateCompact: string;
}

const GENDER_MAP = new Map<string, { code: 'm' | 'f'; label: '남자' | '여자' }>(
  [
    ['남자', { code: 'm', label: '남자' }],
    ['남', { code: 'm', label: '남자' }],
    ['m', { code: 'm', label: '남자' }],
    ['male', { code: 'm', label: '남자' }],
    ['여자', { code: 'f', label: '여자' }],
    ['여', { code: 'f', label: '여자' }],
    ['f', { code: 'f', label: '여자' }],
    ['female', { code: 'f', label: '여자' }],
  ],
);

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

export function parseFortuneInput(rawInput: string): ParsedFortuneInput {
  const [rawGender, rawBirthDate] = rawInput
    .split(',')
    .map((value) => value.trim());

  if (!rawGender || !rawBirthDate) {
    throw new Error(INVALID_FORTUNE_INPUT);
  }

  const gender = GENDER_MAP.get(rawGender.toLowerCase());

  if (!gender) {
    throw new Error(INVALID_GENDER);
  }

  const birthDateCompact = rawBirthDate.replace(/-/g, '');

  if (!/^\d{8}$/.test(birthDateCompact)) {
    throw new Error(INVALID_BIRTH_DATE);
  }

  return {
    genderCode: gender.code,
    genderLabel: gender.label,
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

  if (query === FORTUNE_QUERIES.TOMORROW) {
    return panels[1] ?? panels[0];
  }

  return panels[0];
}

function extractFortune(
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
