import {
  TicketacoUpcomingEvent,
  TicketacoUpcomingEventEntry,
} from '../ticketaco.types';

export const TICKETACO_REPOSITORY = Symbol('TICKETACO_REPOSITORY');

export interface TicketacoSubscriptionSyncTarget {
  id: string;
  channelId: string;
}

export interface TicketacoOrganization {
  id: string;
  slug: string;
  name: string;
  subscriptions: TicketacoSubscriptionSyncTarget[];
}

export interface UpsertTicketacoEventInput {
  externalEventId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  imageUrl: string | null;
  venue: string | null;
  sourceCreatedAt: Date;
}

export interface TicketacoNotificationCandidate {
  eventId: string;
  subscriptionId: string;
  channelId: string;
  orgName: string;
  event: TicketacoUpcomingEvent;
}

export interface TicketacoRepository {
  getOrganizations(): Promise<TicketacoOrganization[]>;
  updateOrganizationName(organizationId: string, name: string): Promise<void>;
  upsertEvents(
    organizationId: string,
    events: UpsertTicketacoEventInput[],
  ): Promise<void>;
  getNotificationCandidates(
    organizationId: string,
  ): Promise<TicketacoNotificationCandidate[]>;
  recordDelivery(
    eventId: string,
    subscriptionId: string,
    sentAt: Date,
  ): Promise<void>;
  getUpcomingEventEntries(): Promise<TicketacoUpcomingEventEntry[]>;
}
