import { DayOfWeek } from '../constants/reservation.constants';

const KST_OFFSET_HOURS = 9;
const KST_OFFSET_MS = KST_OFFSET_HOURS * 60 * 60 * 1000;

type ParsedTime = {
  hour: number;
  minute: number;
};

type ParsedDate = {
  year: number;
  month: number;
  day: number;
};

// 저장된 Date는 UTC instant로 유지, 예약 입력/표시는 KST 기준으로 계산
function toKstDate(date: Date): Date {
  return new Date(date.getTime() + KST_OFFSET_MS);
}

function toTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}

// HH:mm, 예약 UI/파서의 공통 시간 형식 검증에 사용
export function parseTimeOfDay(value: string): ParsedTime | null {
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

// 저장 전 시간을 항상 HH:mm으로 정규화
export function normalizeTimeOfDay(value: string): string | null {
  const parsed = parseTimeOfDay(value);
  if (!parsed) return null;
  return `${toTwoDigits(parsed.hour)}:${toTwoDigits(parsed.minute)}`;
}

// YYYY-MM-DD 형식만 통과시키고, 2026-02-30 같은 존재하지 않는 날짜는 걸러낸다.
export function parseDateInput(value: string): ParsedDate | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

// JS getUTCDay 결과를 KST 기준 주간 예약 요일 체계(월=1 ... 일=7)로 바꾼다.
export function getKstDayOfWeek(date: Date): DayOfWeek {
  const day = toKstDate(date).getUTCDay();
  return (day === 0 ? 7 : day) as DayOfWeek;
}

// 사용자가 입력한 KST 날짜/시간을 실제 저장용 UTC Date로 변환
export function createKstDate(
  dateInput: string,
  timeInput: string,
): Date | null {
  const parsedDate = parseDateInput(dateInput);
  const parsedTime = parseTimeOfDay(timeInput);

  if (!parsedDate || !parsedTime) return null;

  return new Date(
    Date.UTC(
      parsedDate.year,
      parsedDate.month - 1,
      parsedDate.day,
      parsedTime.hour - KST_OFFSET_HOURS,
      parsedTime.minute,
    ),
  );
}

// 기준 시각을 KST로 해석해서 다음 반복 예약 발생 시각을 계산
// 같은 요일이라도 이미 시간이 지났으면 다음 주 같은 요일로 넘긴다.
export function getNextWeeklyOccurrence(
  dayOfWeek: DayOfWeek,
  timeOfDay: string,
  referenceDate: Date,
): Date {
  const parsedTime = parseTimeOfDay(timeOfDay);
  if (!parsedTime) {
    throw new Error(
      '유효하지 않은 시간 형식입니다. HH:mm 형식을 사용해주세요.',
    );
  }

  const kstReference = toKstDate(referenceDate);
  const currentDay = getKstDayOfWeek(referenceDate);
  const currentMinutes =
    kstReference.getUTCHours() * 60 + kstReference.getUTCMinutes();
  const targetMinutes = parsedTime.hour * 60 + parsedTime.minute;

  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && targetMinutes <= currentMinutes) daysUntil = 7;

  return new Date(
    Date.UTC(
      kstReference.getUTCFullYear(),
      kstReference.getUTCMonth(),
      kstReference.getUTCDate() + daysUntil,
      parsedTime.hour - KST_OFFSET_HOURS,
      parsedTime.minute,
    ),
  );
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Discord 메시지에는 KST 절대 시각을 노출
export function formatDateTimeKst(date: Date): string {
  const kstDate = toKstDate(date);
  const year = kstDate.getUTCFullYear();
  const month = toTwoDigits(kstDate.getUTCMonth() + 1);
  const day = toTwoDigits(kstDate.getUTCDate());
  const hour = toTwoDigits(kstDate.getUTCHours());
  const minute = toTwoDigits(kstDate.getUTCMinutes());

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function formatDateInputKst(date: Date): string {
  const kstDate = toKstDate(date);
  const year = kstDate.getUTCFullYear();
  const month = toTwoDigits(kstDate.getUTCMonth() + 1);
  const day = toTwoDigits(kstDate.getUTCDate());

  return `${year}-${month}-${day}`;
}

export function formatTimeHmKst(date: Date): string {
  const kstDate = toKstDate(date);
  return `${toTwoDigits(kstDate.getUTCHours())}:${toTwoDigits(kstDate.getUTCMinutes())}`;
}
