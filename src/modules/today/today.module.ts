import { Module } from '@nestjs/common';
import { TodayFortuneClient } from './clients/today-fortune.client';
import { TodayWeatherClient } from './clients/today-weather.client';
import { TodayCommands } from './today.commands';
import { TodayService } from './today.service';

@Module({
  providers: [TodayWeatherClient, TodayFortuneClient, TodayService, TodayCommands],
})
export class TodayModule {}
