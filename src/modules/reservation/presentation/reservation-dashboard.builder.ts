import {
  ActionRowBuilder,
  APIEmbedField,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { ChannelReservation } from '../repositories/channel-reservation.repository';
import {
  formatDateTimeKst,
  formatTimeHmKst,
} from '../utils/reservation-time.util';
import { formatRelativeFromNow } from '../utils/reservation-display.util';
import { formatReservationTypeLabel } from '../utils/reservation-label.util';
import {
  RESERVATION_DASHBOARD_BUTTON_ONCE,
  RESERVATION_DASHBOARD_BUTTON_REFRESH,
  RESERVATION_DASHBOARD_BUTTON_WEEKLY,
  RESERVATION_MANAGE_SELECT,
} from '../constants/reservation-interaction.constants';
import { RESERVATION_MESSAGES } from '../constants/reservation.messages';
import { RESERVATION_DASHBOARD_MAX_FIELDS } from '../constants/reservation.constants';

export type ReservationDashboardComponent =
  | ActionRowBuilder<ButtonBuilder>
  | ActionRowBuilder<StringSelectMenuBuilder>;

export interface ReservationDashboardMessage {
  embeds: [EmbedBuilder];
  components: ReservationDashboardComponent[];
}

interface ReservationSelectOption {
  label: string;
  description: string;
  value: string;
}

export function buildReservationDashboardMessage(
  reservations: ChannelReservation[],
  notice?: string,
): ReservationDashboardMessage {
  const now = new Date();
  const sortedReservations = [...reservations].sort(
    (a, b) => a.nextScheduledAt.getTime() - b.nextScheduledAt.getTime(),
  );
  const nextReservation = sortedReservations[0];

  const embed = new EmbedBuilder()
    .setTitle(RESERVATION_MESSAGES.dashboard.title)
    .setDescription(
      buildDashboardDescription(
        sortedReservations,
        nextReservation,
        notice,
        now,
      ),
    )
    .setFooter({
      text: RESERVATION_MESSAGES.dashboard.footerWithMeta(
        sortedReservations.length,
        formatTimeHmKst(now),
      ),
    });

  if (sortedReservations.length > 0) {
    embed.addFields(
      sortedReservations
        .slice(0, RESERVATION_DASHBOARD_MAX_FIELDS)
        .map((reservation, index) =>
          buildReservationField(reservation, index + 1),
        ),
    );
  }

  const components: ReservationDashboardComponent[] = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(RESERVATION_DASHBOARD_BUTTON_ONCE)
        .setLabel(RESERVATION_MESSAGES.dashboard.buttonLabels.once)
        .setEmoji(RESERVATION_MESSAGES.dashboard.buttonEmojis.once)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(RESERVATION_DASHBOARD_BUTTON_WEEKLY)
        .setLabel(RESERVATION_MESSAGES.dashboard.buttonLabels.weekly)
        .setEmoji(RESERVATION_MESSAGES.dashboard.buttonEmojis.weekly)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(RESERVATION_DASHBOARD_BUTTON_REFRESH)
        .setLabel(RESERVATION_MESSAGES.dashboard.buttonLabels.refresh)
        .setEmoji(RESERVATION_MESSAGES.dashboard.buttonEmojis.refresh)
        .setStyle(ButtonStyle.Secondary),
    ),
  ];

  if (sortedReservations.length > 0) {
    components.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(RESERVATION_MANAGE_SELECT)
          .setPlaceholder(
            RESERVATION_MESSAGES.dashboard.selectPlaceholders.manage,
          )
          .addOptions(buildReservationOptions(sortedReservations, now)),
      ),
    );
  }

  return {
    embeds: [embed],
    components,
  };
}

function buildDashboardDescription(
  reservations: ChannelReservation[],
  upcoming: ChannelReservation | undefined,
  notice: string | undefined,
  now: Date,
): string {
  const sections: string[] = [];

  if (notice) {
    sections.push(`### ${notice}`);
  }

  if (reservations.length === 0) {
    sections.push(...RESERVATION_MESSAGES.dashboard.emptyStateLines);
  } else {
    sections.push(buildUpcomingBanner(upcoming, now));
    sections.push(...RESERVATION_MESSAGES.dashboard.descriptionLines);
  }

  if (reservations.length > RESERVATION_DASHBOARD_MAX_FIELDS) {
    sections.push(RESERVATION_MESSAGES.dashboard.tooManyNotice);
  }

  return sections.join('\n\n');
}

function buildUpcomingBanner(
  upcoming: ChannelReservation | undefined,
  now: Date,
): string {
  const bannerPrefix = RESERVATION_MESSAGES.dashboard.upcomingBannerPrefix;
  if (!upcoming) {
    return `${bannerPrefix}: ${RESERVATION_MESSAGES.dashboard.upcomingBannerNone}`;
  }

  const relativeScheduledAt = formatRelativeFromNow(
    upcoming.nextScheduledAt,
    now,
  );
  return `${bannerPrefix}: **${relativeScheduledAt}** · ${upcoming.title}`;
}

function buildReservationField(
  reservation: ChannelReservation,
  displayOrder: number,
): APIEmbedField {
  const name = `${displayOrder}. ${reservation.title}`.slice(0, 256);
  const value = [
    formatDateTimeKst(reservation.nextScheduledAt),
    `${reservation.reminderOffsetMinutes}분 전 알림`,
  ].join(' · ');

  return {
    name,
    value: value.slice(0, 1024),
    inline: false,
  };
}

function buildReservationOptions(
  reservations: ChannelReservation[],
  now: Date,
): ReservationSelectOption[] {
  return reservations
    .slice(0, RESERVATION_DASHBOARD_MAX_FIELDS)
    .map((reservation) => {
      const relativeScheduledAt = formatRelativeFromNow(
        reservation.nextScheduledAt,
        now,
      );

      return {
        label: `${relativeScheduledAt} · ${reservation.title}`.slice(0, 100),
        description: formatReservationTypeLabel(reservation).slice(0, 100),
        value: reservation.id,
      };
    });
}
