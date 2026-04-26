export const RESERVATION_REMINDER_MINUTES = 10;
export const RESERVATION_MAX_REMINDER_MINUTES = 24 * 60;
export const RESERVATION_REMINDER_MINUTES_STEP = 5;
export const RESERVATION_DASHBOARD_MAX_FIELDS = 25;

export const RESERVATION_DATE_INPUT_MAX_LENGTH = 10;
export const RESERVATION_TIME_INPUT_MAX_LENGTH = 5;
export const RESERVATION_TITLE_MAX_LENGTH = 80;
export const RESERVATION_REMINDER_MESSAGE_MAX_LENGTH = 1000;
export const RESERVATION_REMINDER_OFFSET_INPUT_MAX_LENGTH = 4;

export const RESERVATION_KIND_ONCE = 'once';
export const RESERVATION_KIND_WEEKLY = 'weekly';

export const RESERVATION_KIND_ONCE_DISPLAY_LABEL = '일회성';

export const DAY_OF_WEEK_SHORT_LABELS = {
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
  7: '일',
} as const;

export const DAY_OF_WEEK_FULL_LABELS = {
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
  7: '일요일',
} as const;

export type ReservationKind =
  | typeof RESERVATION_KIND_ONCE
  | typeof RESERVATION_KIND_WEEKLY;

export type DayOfWeek = keyof typeof DAY_OF_WEEK_FULL_LABELS;
