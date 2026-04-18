import { Repository } from 'typeorm';
import {
  TicketacoNotificationCandidate,
  TicketacoOrganization,
  TicketacoRepository,
  UpsertTicketacoEventInput,
} from './ticketaco.repository';
import { TicketacoOrganizationEntity } from '../entities/ticketaco-organization.entity';
import { TicketacoEventEntity } from '../entities/ticketaco-event.entity';
import { TicketacoDeliveryEntity } from '../entities/ticketaco-delivery.entity';

export class TicketacoTypeormRepository implements TicketacoRepository {
  constructor(
    private readonly organizationRepo: Repository<TicketacoOrganizationEntity>,
    private readonly eventRepo: Repository<TicketacoEventEntity>,
    private readonly deliveryRepo: Repository<TicketacoDeliveryEntity>,
  ) {}

  async getOrganizations(): Promise<TicketacoOrganization[]> {
    const organizations = await this.organizationRepo.find({
      relations: { subscriptions: { channel: true } },
      order: { slug: 'ASC', subscriptions: { createdAt: 'ASC' } },
    });

    return organizations.map((organization) => ({
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      subscriptions: organization.subscriptions.map((subscription) => ({
        id: subscription.id,
        channelId: subscription.channel.channelId,
      })),
    }));
  }

  async updateOrganizationName(
    organizationId: string,
    name: string,
  ): Promise<void> {
    await this.organizationRepo.update(organizationId, { name });
  }

  async upsertEvents(
    organizationId: string,
    events: UpsertTicketacoEventInput[],
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.eventRepo.upsert(
      events.map((event) => ({
        organizationId,
        externalEventId: event.externalEventId,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        imageUrl: event.imageUrl,
        venue: event.venue,
        sourceCreatedAt: event.sourceCreatedAt,
      })),
      ['organizationId', 'externalEventId'],
    );
  }

  async getNotificationCandidates(
    organizationId: string,
  ): Promise<TicketacoNotificationCandidate[]> {
    const rows = await this.eventRepo
      .createQueryBuilder('event')
      .innerJoin('event.organization', 'organization')
      .innerJoin('organization.subscriptions', 'subscription')
      .innerJoin('subscription.channel', 'channel')
      .leftJoin(
        TicketacoDeliveryEntity,
        'delivery',
        'delivery.event_id = event.id AND delivery.subscription_id = subscription.id',
      )
      .where('organization.id = :organizationId', { organizationId })
      .andWhere('event.end_at > :now', { now: new Date() })
      .andWhere('delivery.id IS NULL')
      .orderBy('event.start_at', 'ASC')
      .select([
        'event.id AS event_id',
        'event.external_event_id AS external_event_id',
        'event.title AS event_title',
        'event.start_at AS event_start_at',
        'event.end_at AS event_end_at',
        'event.image_url AS event_image_url',
        'event.source_created_at AS event_source_created_at',
        'event.venue AS event_venue',
        'subscription.id AS subscription_id',
        'channel.channel_id AS channel_id',
        'organization.name AS organization_name',
      ])
      .getRawMany<{
        event_id: string;
        external_event_id: string;
        event_title: string;
        event_start_at: Date;
        event_end_at: Date;
        event_image_url: string | null;
        event_source_created_at: Date;
        event_venue: string | null;
        subscription_id: string;
        channel_id: string;
        organization_name: string;
      }>();

    return rows.map((row) => ({
      eventId: row.event_id,
      subscriptionId: row.subscription_id,
      channelId: row.channel_id,
      orgName: row.organization_name,
      event: {
        id: row.external_event_id,
        title: row.event_title,
        startDate: new Date(row.event_start_at).toISOString(),
        endDate: new Date(row.event_end_at).toISOString(),
        imageUrl: row.event_image_url,
        createdAt: new Date(row.event_source_created_at).toISOString(),
        venue: row.event_venue,
      },
    }));
  }

  async recordDelivery(
    eventId: string,
    subscriptionId: string,
    sentAt: Date,
  ): Promise<void> {
    await this.deliveryRepo
      .createQueryBuilder()
      .insert()
      .into(TicketacoDeliveryEntity)
      .values({ eventId, subscriptionId, sentAt })
      .orIgnore()
      .execute();
  }
}
