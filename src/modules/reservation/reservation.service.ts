import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  RESERVATION_KIND_ONCE,
  RESERVATION_KIND_WEEKLY,
  RESERVATION_MAX_REMINDER_MINUTES,
} from './constants/reservation.constants';
import {
  ChannelReservation,
  CreateChannelReservationInput,
  UpdateChannelReservationInput,
} from './repositories/channel-reservation.repository';
import {
  CreateReservationInput,
  UpdateReservationInput,
} from './types/reservation.types';
import {
  CHANNEL_RESERVATION_REPOSITORY,
  ChannelReservationRepository,
} from './repositories/channel-reservation.repository';
import {
  addMinutes,
  createKstDate,
  formatDateInputKst,
  formatDateTimeKst,
  formatTimeHmKst,
  getNextWeeklyOccurrence,
  normalizeTimeOfDay,
} from './utils/reservation-time.util';
import {
  buildPastReservationErrorMessage,
  RESERVATION_ERRORS,
} from './constants/reservation.errors';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    @Inject(CHANNEL_RESERVATION_REPOSITORY)
    private readonly repository: ChannelReservationRepository,
  ) {}

  // 예약 생성
  async createReservation(
    input: CreateReservationInput,
    now: Date = new Date(),
  ): Promise<ChannelReservation> {
    const normalizedTimeOfDay = normalizeTimeOfDay(input.timeInput);

    if (!normalizedTimeOfDay) {
      throw new Error(RESERVATION_ERRORS.invalidTime);
    }

    const baseCreateInput = {
      channelId: input.channelId,
      creatorUserId: input.creatorUserId,
      title: input.title,
      reminderMessage: input.reminderMessage,
      reminderOffsetMinutes: input.reminderOffsetMinutes,
    };

    if (input.kind === RESERVATION_KIND_ONCE) {
      const occurrenceAt = createKstDate(input.dateInput, normalizedTimeOfDay);
      if (!occurrenceAt) {
        throw new Error(RESERVATION_ERRORS.invalidDate);
      }

      if (occurrenceAt.getTime() <= now.getTime()) {
        throw new Error(
          buildPastReservationErrorMessage(
            formatDateTimeKst(occurrenceAt),
            formatDateTimeKst(now),
          ),
        );
      }

      const createInput: CreateChannelReservationInput = {
        ...baseCreateInput,
        kind: RESERVATION_KIND_ONCE,
        dayOfWeek: null,
        timeOfDay: null,
        nextScheduledAt: occurrenceAt,
      };

      return this.repository.createReservation(createInput);
    } else {
      const createInput: CreateChannelReservationInput = {
        ...baseCreateInput,
        kind: RESERVATION_KIND_WEEKLY,
        dayOfWeek: input.dayOfWeek,
        timeOfDay: normalizedTimeOfDay,
        nextScheduledAt: getNextWeeklyOccurrence(
          input.dayOfWeek,
          normalizedTimeOfDay,
          now,
        ),
      };

      return this.repository.createReservation(createInput);
    }
  }

  // 예약 조회
  getReservation(
    channelId: string,
    reservationId: string,
  ): Promise<ChannelReservation | null> {
    return this.repository.findByChannelAndId(channelId, reservationId);
  }

  // 예약 수정
  async updateReservation(
    input: UpdateReservationInput,
    now: Date = new Date(),
  ): Promise<ChannelReservation> {
    const targetReservation = await this.repository.findByChannelAndId(
      input.channelId,
      input.reservationId,
    );

    if (!targetReservation) {
      throw new Error(RESERVATION_ERRORS.reservationNotFound);
    }

    const updateInput: UpdateChannelReservationInput = {
      title: input.title,
      reminderMessage: input.reminderMessage,
      reminderOffsetMinutes: input.reminderOffsetMinutes,
    };

    // 일회성 예약: 날짜/시간 재 처리
    if (targetReservation.kind === RESERVATION_KIND_ONCE) {
      if (input.dateInput || input.timeInput) {
        const normalizedTimeOfDay =
          input.timeInput !== undefined
            ? this.normalizeInputTime(input.timeInput)
            : formatTimeHmKst(targetReservation.nextScheduledAt);

        const dateInput =
          input.dateInput ??
          formatDateInputKst(targetReservation.nextScheduledAt);
        const nextScheduledAt = createKstDate(dateInput, normalizedTimeOfDay);

        if (!nextScheduledAt) {
          throw new Error(RESERVATION_ERRORS.invalidDate);
        }

        if (nextScheduledAt.getTime() <= now.getTime()) {
          throw new Error(
            buildPastReservationErrorMessage(
              formatDateTimeKst(nextScheduledAt),
              formatDateTimeKst(now),
            ),
          );
        }

        updateInput.nextScheduledAt = nextScheduledAt;
      }
    }

    // 반복 예약: 시간만 재 처리
    if (targetReservation.kind === RESERVATION_KIND_WEEKLY) {
      if (input.timeInput !== undefined) {
        const normalizedTimeOfDay = this.normalizeInputTime(input.timeInput);

        updateInput.timeOfDay = normalizedTimeOfDay;
        updateInput.nextScheduledAt = getNextWeeklyOccurrence(
          targetReservation.dayOfWeek,
          normalizedTimeOfDay,
          now,
        );
      }
    }

    await this.repository.updateReservation(targetReservation.id, updateInput);

    const updatedBase = {
      ...targetReservation,
      title: input.title,
      reminderMessage: input.reminderMessage,
      reminderOffsetMinutes: input.reminderOffsetMinutes,
      nextScheduledAt:
        updateInput.nextScheduledAt ?? targetReservation.nextScheduledAt,
      updatedAt: new Date(),
    };

    if (targetReservation.kind === RESERVATION_KIND_ONCE) {
      return {
        ...updatedBase,
        kind: RESERVATION_KIND_ONCE,
        dayOfWeek: null,
        timeOfDay: null,
      };
    }

    return {
      ...updatedBase,
      kind: RESERVATION_KIND_WEEKLY,
      dayOfWeek: targetReservation.dayOfWeek,
      timeOfDay: updateInput.timeOfDay ?? targetReservation.timeOfDay,
    };
  }

  // 예약 목록 조회
  listReservations(channelId: string): Promise<ChannelReservation[]> {
    return this.repository.findByChannel(channelId);
  }

  // 예약 삭제
  deleteReservation(channelId: string, id: string): Promise<boolean> {
    return this.repository.deleteByChannelAndId(channelId, id);
  }

  // 등록된 예약 알림 처리
  async processDueReservations(
    sendReminder: (reservation: ChannelReservation) => Promise<boolean>,
    now: Date = new Date(),
  ): Promise<void> {
    // 허용된 최대 사전 알림 시간까지 후보를 조회하기 위한 범위다.
    const cutoff = addMinutes(now, RESERVATION_MAX_REMINDER_MINUTES);
    const dueReservations =
      await this.repository.findByNextScheduledBefore(cutoff);

    for (const reservation of dueReservations) {
      try {
        await this.processDueReservation(reservation, sendReminder, now);
      } catch (error) {
        this.logger.error(
          `예약 처리 중 오류가 발생했습니다. reservationId=${reservation.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private async processDueReservation(
    reservation: ChannelReservation,
    sendReminder: (reservation: ChannelReservation) => Promise<boolean>,
    now: Date,
  ): Promise<void> {
    // 예약 시간이 지났는지 확인
    if (reservation.nextScheduledAt.getTime() <= now.getTime()) {
      await this.advanceReservation(reservation, now);
      return;
    }

    // 알림은 nextScheduledAt - offset ~ nextScheduledAt 사이에 전송
    if (!this.shouldSendReminder(reservation, now)) {
      return;
    }

    // 중복 전송 방지
    if (
      await this.repository.hasNotification(
        reservation.id,
        reservation.nextScheduledAt,
      )
    ) {
      return;
    }

    const isReminderSent = await sendReminder(reservation);

    // 전송 실패 시 저장 x, 다음 스케줄러 실행에서 재시도
    if (!isReminderSent) {
      return;
    }

    await this.repository.recordNotification(
      reservation.id,
      reservation.nextScheduledAt,
      new Date(),
    );
  }

  private shouldSendReminder(
    reservation: ChannelReservation,
    now: Date,
  ): boolean {
    const reminderAt = addMinutes(
      reservation.nextScheduledAt,
      -reservation.reminderOffsetMinutes,
    );

    return reminderAt.getTime() <= now.getTime();
  }

  private normalizeInputTime(timeInput: string): string {
    const normalizedTimeOfDay = normalizeTimeOfDay(timeInput);

    if (!normalizedTimeOfDay) {
      throw new Error(RESERVATION_ERRORS.invalidTime);
    }

    return normalizedTimeOfDay;
  }

  private async advanceReservation(
    reservation: ChannelReservation,
    now: Date,
  ): Promise<void> {
    if (reservation.kind === RESERVATION_KIND_ONCE) {
      await this.repository.deleteById(reservation.id);
      return;
    }

    await this.repository.updateNextScheduled(
      reservation.id,
      getNextWeeklyOccurrence(
        reservation.dayOfWeek,
        reservation.timeOfDay,
        now,
      ),
    );
  }
}
