import {
  DayOfWeek,
  RESERVATION_KIND_ONCE,
  RESERVATION_KIND_WEEKLY,
} from '../constants/reservation.constants';

interface CreateReservationInputBase {
  channelId: string;
  creatorUserId: string;
  timeInput: string;
  title: string;
  reminderMessage: string | null;
  reminderOffsetMinutes: number;
}

export interface CreateOnceReservationInput extends CreateReservationInputBase {
  kind: typeof RESERVATION_KIND_ONCE;
  dateInput: string;
}

export interface CreateWeeklyReservationInput extends CreateReservationInputBase {
  kind: typeof RESERVATION_KIND_WEEKLY;
  dayOfWeek: DayOfWeek;
}

export type CreateReservationInput =
  | CreateOnceReservationInput
  | CreateWeeklyReservationInput;

export interface UpdateReservationInput {
  channelId: string;
  reservationId: string;
  dateInput?: string;
  timeInput?: string;
  title: string;
  reminderMessage: string | null;
  reminderOffsetMinutes: number;
}
