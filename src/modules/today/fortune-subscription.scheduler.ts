import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { formatTodayFortune } from './formatters/today-fortune-message.formatter';
import { FortuneSubscriptionService } from './services/fortune-subscription.service';
import { TodayFortuneService } from './services/today-fortune.service';

@Injectable()
export class FortuneSubscriptionScheduler {
  private readonly logger = new Logger(FortuneSubscriptionScheduler.name);

  constructor(
    private readonly client: Client,
    private readonly subscriptionService: FortuneSubscriptionService,
    private readonly fortuneService: TodayFortuneService,
  ) {}

  @Cron('0 8 * * *', { timeZone: 'Asia/Seoul', waitForCompletion: true })
  async sendDailyFortune(): Promise<void> {
    if (!this.client.isReady()) {
      this.logger.warn('Discord client not ready, skipping daily fortune');
      return;
    }

    const subscriptions = await this.subscriptionService.findAll();
    if (subscriptions.length === 0) {
      this.logger.log('구독자 없음, skip');
      return;
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const fortune = await this.fortuneService.getTodayFortune(
          sub.gender,
          sub.birthDate,
        );
        const user = await this.client.users.fetch(sub.discordId);
        await user.send({ content: formatTodayFortune(fortune) });
        sent++;
      } catch (error) {
        failed++;
        const reason =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`DM 발송 실패 (${sub.discordId}): ${reason}`);
      }
    }

    this.logger.log(`운세 DM 발송 완료: 성공 ${sent}, 실패 ${failed}`);
  }
}
