import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client } from 'discord.js';
import {
  TICKETACO_API_CLIENT,
  TicketacoApiClient,
} from './ticketaco-api.client';
import { buildTicketacoNotificationEmbed } from './ticketaco.embeds';
import { toUpsertTicketacoEventInput } from './ticketaco.utils';
import {
  TICKETACO_REPOSITORY,
  TicketacoNotificationCandidate,
  TicketacoOrganization,
  TicketacoRepository,
} from './repositories/ticketaco.repository';
import { TicketacoUpcomingEventEntry } from './ticketaco.types';

@Injectable()
export class TicketacoService {
  private readonly logger = new Logger(TicketacoService.name);

  constructor(
    private readonly client: Client,
    @Inject(TICKETACO_API_CLIENT)
    private readonly ticketacoApiClient: TicketacoApiClient,
    @Inject(TICKETACO_REPOSITORY)
    private readonly ticketacoRepository: TicketacoRepository,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { waitForCompletion: true })
  private async syncOrganizations(): Promise<void> {
    const organizations = await this.ticketacoRepository.getOrganizations();

    for (const organization of organizations) {
      await this.syncOrganization(organization);
    }
  }

  async getUpcomingEventEntries(): Promise<TicketacoUpcomingEventEntry[]> {
    return this.ticketacoRepository.getUpcomingEventEntries();
  }

  private async syncOrganization(
    organization: TicketacoOrganization,
  ): Promise<void> {
    try {
      const response = await this.ticketacoApiClient.fetchOrganization(
        organization.slug,
      );

      if (response.organization.name !== organization.name) {
        await this.ticketacoRepository.updateOrganizationName(
          organization.id,
          response.organization.name,
        );
      }

      const upcomingEvents = response.events
        .filter(({ end_date }) => Date.parse(end_date) > Date.now())
        .sort((a, b) => Date.parse(a.start_date) - Date.parse(b.start_date))
        .map(toUpsertTicketacoEventInput);

      await this.ticketacoRepository.upsertEvents(
        organization.id,
        upcomingEvents,
      );

      if (!this.client.isReady()) {
        return;
      }

      const candidates =
        await this.ticketacoRepository.getNotificationCandidates(
          organization.id,
        );
      await this.sendNotifications(candidates);
    } catch (error) {
      this.logger.error(`[${organization.slug}] sync failed`, error);
    }
  }

  private async sendNotifications(
    candidates: TicketacoNotificationCandidate[],
  ): Promise<void> {
    for (const candidate of candidates) {
      const sentAt = await this.sendNotification(candidate);
      if (!sentAt) {
        continue;
      }

      try {
        await this.ticketacoRepository.recordDelivery(
          candidate.eventId,
          candidate.subscriptionId,
          sentAt,
        );
        this.logger.log(
          `[${candidate.orgName}] notified: ${candidate.event.title}`,
        );
      } catch (error) {
        this.logger.error(
          `[${candidate.orgName}] delivery record failed after send: ${candidate.event.title}`,
          error,
        );
      }
    }
  }

  private async sendNotification(
    candidate: TicketacoNotificationCandidate,
  ): Promise<Date | null> {
    try {
      const channel = await this.client.channels.fetch(candidate.channelId);
      if (!channel?.isSendable()) {
        return null;
      }

      const embeds = [
        buildTicketacoNotificationEmbed(candidate.orgName, candidate.event),
      ];

      await channel.send({ embeds });
      return new Date();
    } catch (error) {
      this.logger.error(
        `[${candidate.orgName}] notification failed: ${candidate.event.title}`,
        error,
      );
      return null;
    }
  }
}
