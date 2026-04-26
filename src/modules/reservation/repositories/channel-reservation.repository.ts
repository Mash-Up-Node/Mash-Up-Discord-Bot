import {
  DayOfWeek,
  RESERVATION_KIND_ONCE,
  RESERVATION_KIND_WEEKLY,
} from '../constants/reservation.constants';

export const CHANNEL_RESERVATION_REPOSITORY = Symbol(
  'CHANNEL_RESERVATION_REPOSITORY',
);

interface ChannelReservationBase {
  id: string;
  channelId: string;
  creatorUserId: string;
  title: string;
  reminderMessage: string | null;
  reminderOffsetMinutes: number;
  nextScheduledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnceReservation extends ChannelReservationBase {
  kind: typeof RESERVATION_KIND_ONCE;
  dayOfWeek: null;
  timeOfDay: null;
}

export interface WeeklyReservation extends ChannelReservationBase {
  kind: typeof RESERVATION_KIND_WEEKLY;
  dayOfWeek: DayOfWeek;
  timeOfDay: string;
}

export type ChannelReservation = OnceReservation | WeeklyReservation;

interface CreateChannelReservationInputBase {
  channelId: string;
  creatorUserId: string;
  title: string;
  reminderMessage: string | null;
  reminderOffsetMinutes: number;
  nextScheduledAt: Date;
}

export interface CreateOnceReservationInput extends CreateChannelReservationInputBase {
  kind: typeof RESERVATION_KIND_ONCE;
  dayOfWeek: null;
  timeOfDay: null;
}

export interface CreateWeeklyReservationInput extends CreateChannelReservationInputBase {
  kind: typeof RESERVATION_KIND_WEEKLY;
  dayOfWeek: DayOfWeek;
  timeOfDay: string;
}

export type CreateChannelReservationInput =
  | CreateOnceReservationInput
  | CreateWeeklyReservationInput;

export interface UpdateChannelReservationInput {
  title?: string;
  reminderMessage?: string | null;
  reminderOffsetMinutes?: number;
  timeOfDay?: string | null;
  nextScheduledAt?: Date;
}

export interface ChannelReservationRepository {
  createReservation(
    input: CreateChannelReservationInput,
  ): Promise<ChannelReservation>;
  findByChannel(channelId: string): Promise<ChannelReservation[]>;
  findByChannelAndId(
    channelId: string,
    id: string,
  ): Promise<ChannelReservation | null>;
  deleteByChannelAndId(channelId: string, id: string): Promise<boolean>;
  findByNextScheduledBefore(cutoff: Date): Promise<ChannelReservation[]>;
  updateReservation(
    id: string,
    input: UpdateChannelReservationInput,
  ): Promise<void>;
  hasNotification(reservationId: string, scheduledAt: Date): Promise<boolean>;
  recordNotification(
    reservationId: string,
    scheduledAt: Date,
    sentAt: Date,
  ): Promise<void>;
  updateNextScheduled(id: string, nextScheduledAt: Date): Promise<void>;
  deleteById(id: string): Promise<void>;
}
