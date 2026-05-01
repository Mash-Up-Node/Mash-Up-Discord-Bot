import { EmbedBuilder, MessageCreateOptions } from 'discord.js';
import { DEFAULT_RESERVATION_REMINDER_BODY } from '../constants/reservation.defaults';
import { ChannelReservation } from '../repositories/channel-reservation.repository';
import { formatDateTimeKst } from '../utils/reservation-time.util';

const REMINDER_COLOR = 0xe76f51;

export interface ReservationReminderMessage extends Pick<
  MessageCreateOptions,
  'allowedMentions'
> {
  embeds: [EmbedBuilder];
}

export function buildReservationReminderMessage(
  reservation: ChannelReservation,
): ReservationReminderMessage {
  const reminderBody =
    reservation.reminderMessage ?? DEFAULT_RESERVATION_REMINDER_BODY;

  const embed = new EmbedBuilder()
    .setColor(REMINDER_COLOR)
    .setTitle(`⏰ ${reservation.title}`)
    .setDescription(
      [
        `**일정이 ${reservation.reminderOffsetMinutes}분 뒤 시작돼요.**`,
        '',
        reminderBody,
      ].join('\n'),
    )
    .addFields({
      name: '📅 일정 시각',
      value: formatDateTimeKst(reservation.nextScheduledAt),
      inline: true,
    });

  return {
    allowedMentions: { parse: ['users'] },
    embeds: [embed],
  };
}
