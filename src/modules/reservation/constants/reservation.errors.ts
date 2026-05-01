export const RESERVATION_ERRORS = {
  invalidTime:
    '시간 형식이 올바르지 않아요. HH:mm 24시간제로 입력해주세요. 예: 09:00, 19:30, 23:15',
  invalidDate:
    '날짜 형식이 올바르지 않아요. YYYY-MM-DD로 입력해주세요. 예: 2026-04-25',
  reservationNotFound: '현재 채널에서 해당 예약을 찾지 못했습니다.',
  reminderOffsetInteger: '알림 시간은 분 단위 정수로 입력해주세요.',
  emptyTitle: '제목은 비워둘 수 없습니다.',
} as const;

export function buildReservationTitleLengthErrorMessage(
  maxLength: number,
): string {
  return `제목은 ${maxLength}자 이하로 입력해주세요.`;
}

export function buildReservationReminderMessageLengthErrorMessage(
  maxLength: number,
): string {
  return `알림 메시지는 ${maxLength}자 이하로 입력해주세요.`;
}

export function buildPastReservationErrorMessage(
  scheduledAt: string,
  now: string,
): string {
  return [
    '과거 시각으로는 예약할 수 없습니다.',
    `입력한 시각: ${scheduledAt}`,
    `현재 시각: ${now}`,
  ].join('\n');
}

export function buildReminderOffsetRangeErrorMessage(
  maxMinutes: number,
): string {
  return `알림 시간은 1분 이상 ${maxMinutes}분 이하로 입력해주세요.`;
}

export function buildReminderOffsetStepErrorMessage(
  stepMinutes: number,
): string {
  return `알림 시간은 ${stepMinutes}분 단위로 입력해주세요. 예: 5, 10, 15`;
}
