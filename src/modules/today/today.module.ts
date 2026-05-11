import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodayFortuneClient } from './clients/today-fortune.client';
import { TodayWeatherClient } from './clients/today-weather.client';
import { FortuneSubscriptionEntity } from './entities/fortune-subscription.entity';
import { FortuneSubscriptionCommands } from './fortune-subscription.commands';
import { FortuneSubscriptionScheduler } from './fortune-subscription.scheduler';
import { FortuneSubscriptionService } from './services/fortune-subscription.service';
import { TodayFortuneService } from './services/today-fortune.service';
import { TodayWeatherService } from './services/today-weather.service';
import { TodayCommands } from './today.commands';

@Module({
  imports: [TypeOrmModule.forFeature([FortuneSubscriptionEntity])],
  providers: [
    TodayWeatherClient,
    TodayFortuneClient,
    TodayWeatherService,
    TodayFortuneService,
    FortuneSubscriptionService,
    TodayCommands,
    FortuneSubscriptionCommands,
    FortuneSubscriptionScheduler,
  ],
})
export class TodayModule {}
