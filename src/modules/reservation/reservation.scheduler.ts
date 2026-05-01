import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client, PermissionFlagsBits } from 'discord.js';
import { buildReservationReminderMessage } from './presentation';
import { ReservationService } from './reservation.service';

function getDiscordErrorDetails(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return '';
  }

  const discordError = error as {
    code?: unknown;
    status?: unknown;
    method?: unknown;
    url?: unknown;
  };

  return [
    `code=${String(discordError.code ?? 'unknown')}`,
    `status=${String(discordError.status ?? 'unknown')}`,
    `method=${String(discordError.method ?? 'unknown')}`,
    `apiUrl=${String(discordError.url ?? 'unknown')}`,
  ].join(', ');
}

function getChannelDiagnostics(
  channel: Awaited<ReturnType<Client['channels']['fetch']>>,
  client: Client,
): string {
  if (!channel || !channel.isTextBased()) {
    return 'channelDiagnostics=unavailable';
  }

  const permissions =
    'permissionsFor' in channel && client.user
      ? channel.permissionsFor(client.user)
      : null;

  const canViewChannel = permissions?.has(PermissionFlagsBits.ViewChannel);
  const canSendMessages = permissions?.has(PermissionFlagsBits.SendMessages);
  const canEmbedLinks = permissions?.has(PermissionFlagsBits.EmbedLinks);
  const canSendMessagesInThreads = permissions?.has(
    PermissionFlagsBits.SendMessagesInThreads,
  );
  const isThread = channel.isThread();
  const threadState = isThread
    ? `, archived=${String(channel.archived)}, locked=${String(channel.locked)}`
    : '';

  return [
    `channelType=${channel.type}`,
    `isThread=${String(isThread)}${threadState}`,
    `canViewChannel=${String(canViewChannel)}`,
    `canSendMessages=${String(canSendMessages)}`,
    `canEmbedLinks=${String(canEmbedLinks)}`,
    `canSendMessagesInThreads=${String(canSendMessagesInThreads)}`,
  ].join(', ');
}

@Injectable()
export class ReservationScheduler {
  private readonly logger = new Logger(ReservationScheduler.name);

  constructor(
    private readonly reservationService: ReservationService,
    private readonly client: Client,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
  async handleReservations(): Promise<void> {
    try {
      await this.reservationService.processDueReservations(
        // 알람 전송 로직
        async (reservation) => {
          let stage = 'fetch';
          let channelUrl = `https://discord.com/channels/@me/${reservation.channelId}`;
          let guildId = 'unknown';
          let channelDiagnostics = 'channelDiagnostics=notFetched';

          try {
            const channel = await this.client.channels.fetch(
              reservation.channelId,
            );

            if (!channel || !channel.isTextBased() || !('send' in channel)) {
              this.logger.warn(
                `일정 알림 채널을 찾지 못했습니다. stage=${stage}, reservationId=${reservation.id}, channelId=${reservation.channelId}, guildId=${guildId}, channelUrl=${channelUrl}`,
              );
              return false;
            }

            guildId =
              'guildId' in channel ? (channel.guildId ?? guildId) : guildId;
            channelUrl = `https://discord.com/channels/${guildId}/${reservation.channelId}`;
            channelDiagnostics = getChannelDiagnostics(channel, this.client);
            stage = 'send';

            await channel.send(buildReservationReminderMessage(reservation));

            return true;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            this.logger.error(
              `일정 알림 전송에 실패했습니다. stage=${stage}, reservationId=${reservation.id}, channelId=${reservation.channelId}, guildId=${guildId}, channelUrl=${channelUrl}, ${channelDiagnostics}, reason=${errorMessage}, ${getDiscordErrorDetails(error)}`,
            );
            return false;
          }
        },
      );
    } catch (error) {
      this.logger.error(
        '일정 스케줄러 실행 중 오류가 발생했습니다.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
