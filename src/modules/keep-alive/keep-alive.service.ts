import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private readonly config: ConfigService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async ping(): Promise<void> {
    const baseUrl = this.config.get<string>('RENDER_EXTERNAL_URL');
    if (!baseUrl) {
      this.logger.debug('Keep-alive skipped: RENDER_EXTERNAL_URL not set');
      return;
    }

    const url = `${baseUrl}/health`;
    try {
      const res = await fetch(url);
      this.logger.log(`Keep-alive → ${res.status}`);
    } catch (err) {
      this.logger.warn(`Keep-alive failed: ${(err as Error).message}`);
    }
  }
}
