import {
  INVALID_BIRTH_DATE,
  INVALID_FORTUNE_INPUT,
  INVALID_GENDER,
} from '../constants/today.messages';

export interface ParsedFortuneInput {
  genderCode: 'm' | 'f';
  genderLabel: '남자' | '여자';
  birthDate: string;
  birthDateCompact: string;
}

// 축약형/영문 성별 입력의 공급자 형식 정규화
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

// 슬래시 커맨드 문자열의 네이버 API 요청 필드 파싱
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
