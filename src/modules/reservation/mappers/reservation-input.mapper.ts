import {
  DayOfWeek,
  RESERVATION_KIND_ONCE,
  RESERVATION_KIND_WEEKLY,
  RESERVATION_MAX_REMINDER_MINUTES,
  RESERVATION_REMINDER_MESSAGE_MAX_LENGTH,
  RESERVATION_REMINDER_MINUTES,
  RESERVATION_REMINDER_MINUTES_STEP,
  RESERVATION_TITLE_MAX_LENGTH,
} from '../constants/reservation.constants';
import { OnceReservationModalDto } from '../dto/once-reservation-modal.dto';
import { UpdateReservationModalDto } from '../dto/update-reservation-modal.dto';
import { WeeklyReservationModalDto } from '../dto/weekly-reservation-modal.dto';
import {
  buildReminderOffsetRangeErrorMessage,
  buildReminderOffsetStepErrorMessage,
  buildReservationReminderMessageLengthErrorMessage,
  buildReservationTitleLengthErrorMessage,
  RESERVATION_ERRORS,
} from '../constants/reservation.errors';
import {
  CreateOnceReservationInput,
  CreateWeeklyReservationInput,
  UpdateReservationInput,
} from '../types/reservation.types';

// 모달 DTO를 서비스 입력으로 변환
export function mapOnceModalToCreateReservationInput(
  dto: OnceReservationModalDto,
  meta: {
    channelId: string;
    creatorUserId: string;
  },
): CreateOnceReservationInput {
  return {
    kind: RESERVATION_KIND_ONCE,
    channelId: meta.channelId,
    creatorUserId: meta.creatorUserId,
    dateInput: dto.date.trim(),
    timeInput: dto.time.trim(),
    title: parseReservationTitle(dto.title),
    reminderMessage: parseReservationReminderMessage(dto.reminderMessage),
    reminderOffsetMinutes: parseReservationReminderOffsetMinutes(
      dto.reminderOffsetMinutes,
    ),
  };
}

export function mapWeeklyModalToCreateReservationInput(
  dto: WeeklyReservationModalDto,
  meta: {
    channelId: string;
    creatorUserId: string;
    dayOfWeek: DayOfWeek;
  },
): CreateWeeklyReservationInput {
  return {
    kind: RESERVATION_KIND_WEEKLY,
    channelId: meta.channelId,
    creatorUserId: meta.creatorUserId,
    dayOfWeek: meta.dayOfWeek,
    timeInput: dto.time.trim(),
    title: parseReservationTitle(dto.title),
    reminderMessage: parseReservationReminderMessage(dto.reminderMessage),
    reminderOffsetMinutes: parseReservationReminderOffsetMinutes(
      dto.reminderOffsetMinutes,
    ),
  };
}

export function mapModalToUpdateReservationInput(
  dto: UpdateReservationModalDto,
  meta: {
    channelId: string;
    reservationId: string;
  },
): UpdateReservationInput {
  return {
    channelId: meta.channelId,
    reservationId: meta.reservationId,
    dateInput: dto.date?.trim(),
    timeInput: dto.time.trim(),
    title: parseReservationTitle(dto.title),
    reminderMessage: parseReservationReminderMessage(dto.reminderMessage),
    reminderOffsetMinutes: parseReservationReminderOffsetMinutes(
      dto.reminderOffsetMinutes,
    ),
  };
}

// 모달 입력 공통 필드 정제, 검증
function parseReservationTitle(value: string): string {
  const parsedTitle = value.trim();

  if (!parsedTitle) {
    throw new Error(RESERVATION_ERRORS.emptyTitle);
  }

  if (parsedTitle.length > RESERVATION_TITLE_MAX_LENGTH) {
    throw new Error(
      buildReservationTitleLengthErrorMessage(RESERVATION_TITLE_MAX_LENGTH),
    );
  }

  return parsedTitle;
}

function parseReservationReminderMessage(value: string): string | null {
  const parsedReminderMessage = value.trim();

  if (!parsedReminderMessage) {
    return null;
  }

  if (parsedReminderMessage.length > RESERVATION_REMINDER_MESSAGE_MAX_LENGTH) {
    throw new Error(
      buildReservationReminderMessageLengthErrorMessage(
        RESERVATION_REMINDER_MESSAGE_MAX_LENGTH,
      ),
    );
  }

  return parsedReminderMessage;
}

function parseReservationReminderOffsetMinutes(value: string): number {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return RESERVATION_REMINDER_MINUTES;
  }

  const parsedReminderOffsetMinutes = Number(trimmedValue);

  if (!Number.isInteger(parsedReminderOffsetMinutes)) {
    throw new Error(RESERVATION_ERRORS.reminderOffsetInteger);
  }

  if (
    parsedReminderOffsetMinutes < 1 ||
    parsedReminderOffsetMinutes > RESERVATION_MAX_REMINDER_MINUTES
  ) {
    throw new Error(
      buildReminderOffsetRangeErrorMessage(RESERVATION_MAX_REMINDER_MINUTES),
    );
  }

  if (parsedReminderOffsetMinutes % RESERVATION_REMINDER_MINUTES_STEP !== 0) {
    throw new Error(
      buildReminderOffsetStepErrorMessage(RESERVATION_REMINDER_MINUTES_STEP),
    );
  }

  return parsedReminderOffsetMinutes;
}
