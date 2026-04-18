import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SelfPingService {
  private readonly logger = new Logger(SelfPingService.name);

  constructor(private readonly config: ConfigService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async ping(): Promise<void> {
    const baseUrl = this.config.get<string>('RENDER_EXTERNAL_URL');
    if (!baseUrl) {
      this.logger.debug('Self-ping skipped: RENDER_EXTERNAL_URL not set');
      return;
    }

    const url = `${baseUrl}/health`;
    try {
      const res = await fetch(url);
      this.logger.log(`Self-ping → ${res.status}`);
    } catch (err) {
      this.logger.warn(`Self-ping failed: ${(err as Error).message}`);
    }
  }
}
