import { Module } from '@nestjs/common';
import { TodayFortuneClient } from './clients/today-fortune.client';
import { TodayWeatherClient } from './clients/today-weather.client';
import { TodayFortuneService } from './services/today-fortune.service';
import { TodayWeatherService } from './services/today-weather.service';
import { TodayCommands } from './today.commands';
import { TodayService } from './today.service';

@Module({
  providers: [
    TodayWeatherClient,
    TodayFortuneClient,
    TodayWeatherService,
    TodayFortuneService,
    TodayService,
    TodayCommands,
  ],
})
export class TodayModule {}
