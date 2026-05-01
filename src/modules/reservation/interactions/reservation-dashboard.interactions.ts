import { Injectable, Logger } from '@nestjs/common';
import {
  Button,
  Context,
  SelectedStrings,
  SlashCommand,
  SlashCommandContext,
  StringSelect,
} from 'necord';
import {
  ButtonInteraction,
  MessageFlags,
  StringSelectMenuInteraction,
} from 'discord.js';
import {
  buildOneTimeReservationModal,
  buildWeeklyDayPickerMessage,
  buildWeeklyReservationModal,
} from '../presentation';
import {
  RESERVATION_DASHBOARD_BUTTON_ONCE,
  RESERVATION_DASHBOARD_BUTTON_REFRESH,
  RESERVATION_DASHBOARD_BUTTON_WEEKLY,
  RESERVATION_WEEKLY_CANCEL_BUTTON,
  RESERVATION_WEEKLY_DAY_SELECT,
} from '../constants/reservation-interaction.constants';
import { RESERVATION_MESSAGES } from '../constants/reservation.messages';
import { ReservationService } from '../reservation.service';
import { ReservationInteractionBase } from './reservation-interaction.base';

@Injectable()
export class ReservationDashboardInteractions extends ReservationInteractionBase {
  protected readonly logger = new Logger(ReservationDashboardInteractions.name);

  constructor(reservationService: ReservationService) {
    super(reservationService);
  }

  @SlashCommand({
    name: '예약',
    description: RESERVATION_MESSAGES.commandDescription,
  })
  async onReservationDashboard(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: RESERVATION_MESSAGES.errors.guildOnly,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await this.executeInteraction(
      interaction,
      'onReservationDashboard',
      {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        userId: interaction.user.id,
      },
      async () => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await interaction.editReply(
          await this.buildDashboardPayload(
            this.requireChannelId(interaction.channelId),
          ),
        );
      },
    );
  }

  @Button(RESERVATION_DASHBOARD_BUTTON_REFRESH)
  async onRefreshDashboard(
    @Context() [interaction]: [ButtonInteraction],
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onRefreshDashboard',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
      },
      async () => {
        await interaction.deferUpdate();
        await interaction.editReply(
          await this.buildDashboardPayload(
            this.requireChannelId(interaction.channelId),
          ),
        );
      },
    );
  }

  @Button(RESERVATION_DASHBOARD_BUTTON_ONCE)
  async onOpenOnceModal(
    @Context() [interaction]: [ButtonInteraction],
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onOpenOnceModal',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
      },
      async () => {
        await interaction.showModal(buildOneTimeReservationModal());
      },
    );
  }

  @Button(RESERVATION_DASHBOARD_BUTTON_WEEKLY)
  async onOpenWeeklyPicker(
    @Context() [interaction]: [ButtonInteraction],
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onOpenWeeklyPicker',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
      },
      async () => {
        // 반복 예약은 요일을 먼저 고른 뒤 모달을 연다.
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          ...buildWeeklyDayPickerMessage(),
        });
      },
    );
  }

  @Button(RESERVATION_WEEKLY_CANCEL_BUTTON)
  async onCancelWeeklyPicker(
    @Context() [interaction]: [ButtonInteraction],
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onCancelWeeklyPicker',
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

  @StringSelect(RESERVATION_WEEKLY_DAY_SELECT)
  async onSelectWeeklyDay(
    @Context() [interaction]: [StringSelectMenuInteraction],
    @SelectedStrings() values: string[],
  ): Promise<void> {
    await this.executeInteraction(
      interaction,
      'onSelectWeeklyDay',
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
        values,
      },
      async () => {
        const selectedDayOfWeek = this.parseDayOfWeek(values[0]);
        // 요일 값은 모달 식별자에 담아 제출 핸들러로 넘긴다.
        await interaction.showModal(
          buildWeeklyReservationModal(selectedDayOfWeek),
        );
      },
    );
  }
}
