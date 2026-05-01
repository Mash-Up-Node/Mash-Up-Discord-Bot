import { Injectable, Logger } from '@nestjs/common';
import {
  Button,
  ComponentParam,
  Context,
  SelectedStrings,
  StringSelect,
} from 'necord';
import {
  ButtonInteraction,
  MessageFlags,
  StringSelectMenuInteraction,
} from 'discord.js';
import {
  buildDeleteConfirmMessage,
  buildManageActionMessage,
  buildUpdateReservationModal,
} from '../presentation';
import {
  RESERVATION_DELETE_CONFIRM_BUTTON,
  RESERVATION_MANAGE_CANCEL_BUTTON,
  RESERVATION_MANAGE_DELETE_BUTTON,
  RESERVATION_MANAGE_EDIT_BUTTON,
  RESERVATION_MANAGE_SELECT,
} from '../constants/reservation-interaction.constants';
import { RESERVATION_MESSAGES } from '../constants/reservation.messages';
import { ReservationService } from '../reservation.service';
import { ReservationInteractionBase } from './reservation-interaction.base';

@Injectable()
export class ReservationManageInteractions extends ReservationInteractionBase {
  protected readonly logger = new Logger(ReservationManageInteractions.name);

  constructor(reservationService: ReservationService) {
    super(reservationService);
  }

  @StringSelect(RESERVATION_MANAGE_SELECT)
  async onSelectReservationToManage(
    @Context() [interaction]: [StringSelectMenuInteraction],
    @SelectedStrings() values: string[],
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onSelectReservationToManage',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
        values,
      },
      async () => {
        const channelId = this.requireChannelId(interaction.channelId);
        const targetReservation = await this.reservationService.getReservation(
          channelId,
          values[0],
        );

        if (!targetReservation) {
          await interaction.reply({
            content: RESERVATION_MESSAGES.errors.manageTargetMissing,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          ...buildManageActionMessage(targetReservation),
        });
      },
    );
  }

  @Button(RESERVATION_MANAGE_EDIT_BUTTON)
  async onClickManageEdit(
    @Context() [interaction]: [ButtonInteraction],
    @ComponentParam('reservationId') reservationId: string,
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onClickManageEdit',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
        reservationId,
      },
      async () => {
        const channelId = this.requireChannelId(interaction.channelId);
        const targetReservation = await this.reservationService.getReservation(
          channelId,
          reservationId,
        );

        if (!targetReservation) {
          await interaction.reply({
            content: RESERVATION_MESSAGES.errors.updateTargetMissing,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await interaction.showModal(
          buildUpdateReservationModal(targetReservation),
        );
      },
    );
  }

  @Button(RESERVATION_MANAGE_DELETE_BUTTON)
  async onClickManageDelete(
    @Context() [interaction]: [ButtonInteraction],
    @ComponentParam('reservationId') reservationId: string,
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onClickManageDelete',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
        reservationId,
      },
      async () => {
        const channelId = this.requireChannelId(interaction.channelId);
        const targetReservation = await this.reservationService.getReservation(
          channelId,
          reservationId,
        );

        if (!targetReservation) {
          await interaction.update({
            content: RESERVATION_MESSAGES.errors.deleteTargetMissing,
            embeds: [],
            components: [],
          });
          return;
        }

        // 기존 관리 메시지를 삭제 확인 메시지로 바꾼다.
        await interaction.update(buildDeleteConfirmMessage(targetReservation));
      },
    );
  }

  @Button(RESERVATION_DELETE_CONFIRM_BUTTON)
  async onConfirmDelete(
    @Context() [interaction]: [ButtonInteraction],
    @ComponentParam('reservationId') reservationId: string,
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onConfirmDelete',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
        reservationId,
      },
      async () => {
        const channelId = this.requireChannelId(interaction.channelId);
        await interaction.deferUpdate();
        const isDeleted = await this.reservationService.deleteReservation(
          channelId,
          reservationId,
        );

        await interaction.editReply({
          content: isDeleted
            ? RESERVATION_MESSAGES.notices.deleted
            : RESERVATION_MESSAGES.errors.deleteTargetMissing,
          embeds: [],
          components: [],
        });
      },
    );
  }

  @Button(RESERVATION_MANAGE_CANCEL_BUTTON)
  async onCancelManage(
    @Context() [interaction]: [ButtonInteraction],
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onCancelManage',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
      },
      async () => {
        await interaction.update({
          content: RESERVATION_MESSAGES.notices.cancelled,
          embeds: [],
          components: [],
        });
      },
    );
  }
}
