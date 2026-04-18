import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SelfPingService } from './self-ping.service';

@Module({
  controllers: [HealthController],
  providers: [SelfPingService],
})
export class HealthModule {}
