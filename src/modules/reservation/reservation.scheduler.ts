import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { buildReservationReminderMessage } from './presentation';
import { ReservationService } from './reservation.service';

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
          try {
            const channel = await this.client.channels.fetch(
              reservation.channelId,
            );

            if (!channel || !channel.isTextBased() || !('send' in channel)) {
              this.logger.warn(
                `일정 알림 채널을 찾지 못했습니다. reservationId=${reservation.id}`,
              );
              return false;
            }

            await channel.send(buildReservationReminderMessage(reservation));

            return true;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            this.logger.error(
              `일정 알림 전송에 실패했습니다. reservationId=${reservation.id}, reason=${errorMessage}`,
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
