import { Injectable } from '@nestjs/common';
import { TodayFortune } from './types/today-fortune.type';
import { TodaySummary } from './types/today-summary.type';
import { TodayFortuneService } from './services/today-fortune.service';
import { TodayWeatherService } from './services/today-weather.service';

@Injectable()
export class TodayService {
  constructor(
    private readonly weatherService: TodayWeatherService,
    private readonly fortuneService: TodayFortuneService,
  ) {}

  async getTodaySummary(location: string): Promise<TodaySummary> {
    return this.weatherService.getTodaySummary(location);
  }

  async getTodayFortune(rawInput: string): Promise<TodayFortune> {
    return this.fortuneService.getTodayFortune(rawInput);
  }

  async getTomorrowFortune(rawInput: string): Promise<TodayFortune> {
    return this.fortuneService.getTomorrowFortune(rawInput);
  }
}
