import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Client } from 'discord.js';
import { UserService } from './user.service';

@Injectable()
export class UserScheduler {
  private readonly logger = new Logger(UserScheduler.name);

  constructor(
    private readonly client: Client,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  @Cron('0 0 * * *', { timeZone: 'Asia/Seoul', waitForCompletion: true })
  async syncMembersDaily(): Promise<void> {
    if (!this.client.isReady()) {
      this.logger.warn('Discord client not ready, skipping member sync');
      return;
    }

    const generation = Number(
      this.configService.getOrThrow<string>('MASHUP_GENERATION'),
    );
    if (!Number.isInteger(generation) || generation <= 0) {
      this.logger.error(
        `MASHUP_GENERATION must be a positive integer, got: ${generation}`,
      );
      return;
    }

    for (const guild of this.client.guilds.cache.values()) {
      try {
        const members = await guild.members.fetch();
        const payload = members
          .filter((m) => !m.user.bot)
          .map((m) => ({ discordId: m.id, displayName: m.displayName }));

        const result = await this.userService.syncMembers(payload, generation);
        this.logger.log(
          `[${guild.name}] sync 완료: ${result.synced}명 동기화, ${result.failed.length}명 파싱 실패`,
        );
      } catch (error) {
        this.logger.error(`[${guild.name}] sync 실패`, error as Error);
      }
    }
  }
}
