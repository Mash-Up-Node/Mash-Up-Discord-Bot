import { Injectable, Logger } from '@nestjs/common';
import { Context, Fields, Modal, ModalParam } from 'necord';
import { MessageFlags, ModalSubmitInteraction } from 'discord.js';
import {
  mapModalToUpdateReservationInput,
  mapOnceModalToCreateReservationInput,
  mapWeeklyModalToCreateReservationInput,
} from '../mappers/reservation-input.mapper';
import { buildReservationMutationNotice } from '../presentation';
import {
  RESERVATION_FIELD_DATE,
  RESERVATION_FIELD_REMINDER,
  RESERVATION_FIELD_REMINDER_OFFSET,
  RESERVATION_FIELD_TIME,
  RESERVATION_FIELD_TITLE,
  RESERVATION_MODAL_ONCE,
  RESERVATION_MODAL_UPDATE,
  RESERVATION_MODAL_WEEKLY,
} from '../constants/reservation-interaction.constants';
import { RESERVATION_MESSAGES } from '../constants/reservation.messages';
import { ReservationService } from '../reservation.service';
import { ReservationInteractionBase } from './reservation-interaction.base';

@Injectable()
export class ReservationModalInteractions extends ReservationInteractionBase {
  protected readonly logger = new Logger(ReservationModalInteractions.name);

  constructor(reservationService: ReservationService) {
    super(reservationService);
  }

  @Modal(RESERVATION_MODAL_ONCE)
  async onSubmitOnceModal(
    @Context() [interaction]: [ModalSubmitInteraction],
    @Fields(RESERVATION_FIELD_DATE) date: string,
    @Fields(RESERVATION_FIELD_TIME) time: string,
    @Fields(RESERVATION_FIELD_TITLE) title: string,
    @Fields(RESERVATION_FIELD_REMINDER) reminderMessage: string,
    @Fields(RESERVATION_FIELD_REMINDER_OFFSET) reminderOffsetMinutes: string,
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onSubmitOnceModal',
      {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        date,
        time,
      },
      async () => {
        const channelId = this.requireChannelId(interaction.channelId);
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const createdReservation =
          await this.reservationService.createReservation(
            mapOnceModalToCreateReservationInput(
              {
                date,
                time,
                title,
                reminderMessage,
                reminderOffsetMinutes,
              },
              {
                channelId,
                creatorUserId: interaction.user.id,
              },
            ),
          );

        await interaction.editReply({
          content: buildReservationMutationNotice(
            RESERVATION_MESSAGES.notices.createdOnce,
            createdReservation,
          ),
          embeds: [],
          components: [],
        });
      },
      RESERVATION_MESSAGES.errors.createFailed,
    );
  }

  @Modal(RESERVATION_MODAL_WEEKLY)
  async onSubmitWeeklyModal(
    @Context() [interaction]: [ModalSubmitInteraction],
    @ModalParam('dayOfWeek') dayOfWeek: string,
    @Fields(RESERVATION_FIELD_TIME) time: string,
    @Fields(RESERVATION_FIELD_TITLE) title: string,
    @Fields(RESERVATION_FIELD_REMINDER) reminderMessage: string,
    @Fields(RESERVATION_FIELD_REMINDER_OFFSET) reminderOffsetMinutes: string,
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onSubmitWeeklyModal',
      {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        dayOfWeek,
        time,
      },
      async () => {
        const channelId = this.requireChannelId(interaction.channelId);
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const createdReservation =
          await this.reservationService.createReservation(
            mapWeeklyModalToCreateReservationInput(
              {
                time,
                title,
                reminderMessage,
                reminderOffsetMinutes,
              },
              {
                channelId,
                creatorUserId: interaction.user.id,
                dayOfWeek: this.parseDayOfWeek(dayOfWeek),
              },
            ),
          );

        await interaction.editReply({
          content: buildReservationMutationNotice(
            RESERVATION_MESSAGES.notices.createdWeekly,
            createdReservation,
          ),
          embeds: [],
          components: [],
        });
      },
      RESERVATION_MESSAGES.errors.createFailed,
    );
  }

  @Modal(RESERVATION_MODAL_UPDATE)
  async onSubmitUpdateModal(
    @Context() [interaction]: [ModalSubmitInteraction],
    @ModalParam('reservationId') reservationId: string,
    @Fields(RESERVATION_FIELD_TIME) time: string,
    @Fields(RESERVATION_FIELD_TITLE) title: string,
    @Fields(RESERVATION_FIELD_REMINDER) reminderMessage: string,
    @Fields(RESERVATION_FIELD_REMINDER_OFFSET) reminderOffsetMinutes: string,
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onSubmitUpdateModal',
      {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        reservationId,
        time,
      },
      async () => {
        const channelId = this.requireChannelId(interaction.channelId);
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const updatedReservation =
          await this.reservationService.updateReservation(
            mapModalToUpdateReservationInput(
              {
                // 반복 예약 수정 모달에는 날짜 필드가 없다.
                date: this.readOptionalModalField(
                  interaction,
                  RESERVATION_FIELD_DATE,
                ),
                time,
                title,
                reminderMessage,
                reminderOffsetMinutes,
              },
              {
                channelId,
                reservationId,
              },
            ),
          );

        await interaction.editReply({
          content: buildReservationMutationNotice(
            RESERVATION_MESSAGES.notices.updated,
            updatedReservation,
          ),
          embeds: [],
          components: [],
        });
      },
      RESERVATION_MESSAGES.errors.updateFailed,
    );
  }

  private readOptionalModalField(
    interaction: ModalSubmitInteraction,
    customId: string,
  ): string | undefined {
    const fieldCollection = interaction.fields?.fields as
      | Map<string, { value: string }>
      | undefined;

    return fieldCollection?.get(customId)?.value;
  }
}
