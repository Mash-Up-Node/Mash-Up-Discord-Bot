import { Logger } from '@nestjs/common';
import {
  ButtonInteraction,
  MessageFlags,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import { SlashCommandContext } from 'necord';
import {
  DayOfWeek,
  DAY_OF_WEEK_SHORT_LABELS,
} from '../constants/reservation.constants';
import { ReservationService } from '../reservation.service';
import {
  buildReservationDashboardMessage,
  ReservationDashboardMessage,
} from '../presentation';
import { RESERVATION_MESSAGES } from '../constants/reservation.messages';
import { isUnknownInteractionError } from '../../../common/discord/interaction-response.util';

type ReservationInteraction =
  | SlashCommandContext[0]
  | ModalSubmitInteraction
  | ButtonInteraction
  | StringSelectMenuInteraction;

export abstract class ReservationInteractionBase {
  protected abstract readonly logger: Logger;

  constructor(protected readonly reservationService: ReservationService) {}

  // 대시보드 응답
  protected async buildDashboardPayload(
    channelId: string,
    notice?: string,
  ): Promise<ReservationDashboardMessage> {
    const channelReservations =
      await this.reservationService.listReservations(channelId);

    return buildReservationDashboardMessage(channelReservations, notice);
  }

  // 요일 값
  protected parseDayOfWeek(value: string): DayOfWeek {
    const parsedDayOfWeek = Number(value);

    if (
      !Number.isInteger(parsedDayOfWeek) ||
      !(parsedDayOfWeek in DAY_OF_WEEK_SHORT_LABELS)
    ) {
      throw new Error('요일 선택값이 올바르지 않습니다.');
    }

    return parsedDayOfWeek as DayOfWeek;
  }

  // 채널 확인
  protected requireChannelId(channelId: string | null): string {
    if (!channelId) {
      throw new Error(RESERVATION_MESSAGES.errors.channelMissing);
    }

    return channelId;
  }

  // 공통 실행
  protected async executeInteraction(
    interaction: ReservationInteraction,
    handler: string,
    context: Record<string, unknown>,
    action: () => Promise<void>,
    fallbackMessage: string = RESERVATION_MESSAGES.errors.unexpected,
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.logInteractionError(handler, error, context);

      if (isUnknownInteractionError(error)) {
        return;
      }

      await this.replyOrEditError(
        interaction,
        error instanceof Error ? error.message : fallbackMessage,
      );
    }
  }

  // 오류 응답
  private async replyOrEditError(
    interaction: ReservationInteraction,
    message: string,
  ): Promise<void> {
    try {
      if ('deferred' in interaction && interaction.deferred) {
        await interaction.editReply({
          content: message,
          embeds: [],
          components: [],
        });
        return;
      }

      if ('replied' in interaction && interaction.replied) {
        await interaction.followUp({
          content: message,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      if (isUnknownInteractionError(error)) {
        return;
      }

      throw error;
    }
  }

  // 예외를 기록
  private logInteractionError(
    handler: string,
    error: unknown,
    context: Record<string, unknown>,
  ): void {
    const contextDetails = JSON.stringify(context);

    if (error instanceof Error) {
      this.logger.error(
        `[${handler}] ${error.message} | context=${contextDetails}`,
        error.stack,
      );
      return;
    }

    this.logger.error(
      `[${handler}] 알 수 없는 오류 | context=${contextDetails}`,
    );
  }
}
