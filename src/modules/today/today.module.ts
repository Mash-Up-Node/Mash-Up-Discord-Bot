import { Module } from '@nestjs/common';
import { TodayCommands } from './today.commands';
import { TodayService } from './today.service';

@Module({
  providers: [TodayService, TodayCommands],
})
export class TodayModule {}
