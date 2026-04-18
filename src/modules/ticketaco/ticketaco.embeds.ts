import { EmbedBuilder } from 'discord.js';
import {
  buildEventUrl,
  formatEventDate,
  formatVenueLabel,
} from './ticketaco.utils';
import { TicketacoUpcomingEvent } from './ticketaco.types';

function buildBaseEmbed(event: TicketacoUpcomingEvent): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(event.title)
    .setURL(buildEventUrl(event.id))
    .addFields(
      {
        name: '📅 일시',
        value: formatEventDate(event.startDate),
        inline: true,
      },
      {
        name: '📍 장소',
        value: formatVenueLabel(event.venue),
        inline: true,
      },
    )
    .setColor(0x5865f2);
}

export function buildTicketacoNotificationEmbed(
  orgName: string,
  event: TicketacoUpcomingEvent,
): EmbedBuilder {
  const embed = buildBaseEmbed(event)
    .setDescription(`**${orgName}**에 새 이벤트가 등록되었습니다!`)
    .setTimestamp(new Date(event.createdAt));

  if (event.imageUrl) {
    embed.setImage(event.imageUrl);
  }

  return embed;
}

export function buildTicketacoListEmbed(
  orgName: string,
  event: TicketacoUpcomingEvent,
): EmbedBuilder {
  const embed = buildBaseEmbed(event).setDescription(orgName);

  if (event.imageUrl) {
    embed.setThumbnail(event.imageUrl);
  }

  return embed;
}
