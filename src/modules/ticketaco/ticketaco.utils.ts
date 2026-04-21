import { TicketacoEvent, TicketacoVenue } from './ticketaco-api.client';
import { UpsertTicketacoEventInput } from './repositories/ticketaco.repository';

const ticketacoEventDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const UNKNOWN_VENUE_LABEL = '장소 미정';

export function formatEventDate(isoDate: string): string {
  return ticketacoEventDateFormatter.format(new Date(isoDate));
}

export const formatVenue = (venues: TicketacoVenue): string =>
  [venues.place_name, venues.place_detail].filter(Boolean).join(' ') ||
  venues.address;

export const formatVenueLabel = (venue: string | null): string =>
  venue?.trim() || UNKNOWN_VENUE_LABEL;

export const buildEventUrl = (eventId: string): string =>
  `https://ticketa.co/event/${eventId}`;

export function toUpsertTicketacoEventInput(
  event: TicketacoEvent,
): UpsertTicketacoEventInput {
  return {
    externalEventId: event.id,
    title: event.title,
    startAt: new Date(event.start_date),
    endAt: new Date(event.end_date),
    imageUrl: event.image_url || null,
    venue: formatVenue(event.venues).trim() || null,
    sourceCreatedAt: new Date(event.created_at),
  };
}
