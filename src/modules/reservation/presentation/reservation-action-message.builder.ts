import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { DAY_OF_WEEK_FULL_LABELS } from '../constants/reservation.constants';
import { ChannelReservation } from '../repositories/channel-reservation.repository';
import { formatRelativeFromNow } from '../utils/reservation-display.util';
import { formatDateTimeKst } from '../utils/reservation-time.util';
import {
  buildReservationDeleteConfirmButtonId,
  buildReservationManageDeleteButtonId,
  buildReservationManageEditButtonId,
  RESERVATION_MANAGE_CANCEL_BUTTON,
  RESERVATION_WEEKLY_CANCEL_BUTTON,
  RESERVATION_WEEKLY_DAY_SELECT,
} from '../constants/reservation-interaction.constants';
import { RESERVATION_MESSAGES } from '../constants/reservation.messages';

type ReservationMessageComponent =
  | ActionRowBuilder<ButtonBuilder>
  | ActionRowBuilder<StringSelectMenuBuilder>;

interface ReservationMessage {
  content?: string;
  embeds?: EmbedBuilder[];
  components: ReservationMessageComponent[];
}

export function buildReservationMutationNotice(
  noticePrefix: string,
  reservation: ChannelReservation,
): string {
  const now = new Date();
  const absoluteScheduledAt = formatDateTimeKst(reservation.nextScheduledAt);
  const relativeScheduledAt = formatRelativeFromNow(
    reservation.nextScheduledAt,
    now,
  );

  return [
    `${noticePrefix} ${RESERVATION_MESSAGES.notices.nextScheduledPrefix}: ${absoluteScheduledAt} (${relativeScheduledAt})`,
    RESERVATION_MESSAGES.notices.refreshDashboardHint,
  ].join('\n');
}

export function buildWeeklyDayPickerMessage(): ReservationMessage {
  const embed = new EmbedBuilder()
    .setColor(0x3a86ff)
    .setTitle(RESERVATION_MESSAGES.weeklyPicker.title)
    .setDescription(RESERVATION_MESSAGES.weeklyPicker.description);

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(RESERVATION_WEEKLY_DAY_SELECT)
          .setPlaceholder(
            RESERVATION_MESSAGES.dashboard.selectPlaceholders.weeklyDay,
          )
          .addOptions(
            (
              Object.entries(DAY_OF_WEEK_FULL_LABELS) as Array<[string, string]>
            ).map(([value, label]) => ({
              label,
              value,
            })),
          ),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(RESERVATION_WEEKLY_CANCEL_BUTTON)
          .setLabel(RESERVATION_MESSAGES.weeklyPicker.cancelLabel)
          .setEmoji(RESERVATION_MESSAGES.weeklyPicker.cancelEmoji)
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

export function buildManageActionMessage(
  reservation: ChannelReservation,
): ReservationMessage {
  const labels = RESERVATION_MESSAGES.actionMessages.manageButtonLabels;
  const emojis = RESERVATION_MESSAGES.actionMessages.manageButtonEmojis;

  return {
    content: RESERVATION_MESSAGES.actionMessages.manageAction(
      reservation.title,
    ),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(buildReservationManageEditButtonId(reservation.id))
          .setLabel(labels.edit)
          .setEmoji(emojis.edit)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(buildReservationManageDeleteButtonId(reservation.id))
          .setLabel(labels.delete)
          .setEmoji(emojis.delete)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(RESERVATION_MANAGE_CANCEL_BUTTON)
          .setLabel(labels.cancel)
          .setEmoji(emojis.cancel)
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

export function buildDeleteConfirmMessage(
  reservation: ChannelReservation,
): ReservationMessage {
  const labels = RESERVATION_MESSAGES.actionMessages.manageButtonLabels;
  const emojis = RESERVATION_MESSAGES.actionMessages.manageButtonEmojis;

  return {
    content: RESERVATION_MESSAGES.actionMessages.deleteConfirm(
      reservation.title,
    ),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(buildReservationDeleteConfirmButtonId(reservation.id))
          .setLabel(labels.confirmDelete)
          .setEmoji(emojis.confirmDelete)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(RESERVATION_MANAGE_CANCEL_BUTTON)
          .setLabel(labels.cancel)
          .setEmoji(emojis.cancel)
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}
