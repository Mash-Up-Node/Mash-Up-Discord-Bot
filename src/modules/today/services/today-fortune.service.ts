import { Injectable } from '@nestjs/common';
import { TodayFortuneClient } from '../clients/today-fortune.client';
import { FORTUNE_QUERIES, FortuneQuery } from '../constants/today.constants';
import {
  createFortuneFetchFailedMessage,
  INVALID_FORTUNE_INPUT,
  INVALID_GENDER,
} from '../constants/today.messages';
import {
  parseFortuneInput,
  parseFortuneResponse,
} from '../parsers/fortune.parser';
import { TodayFortune } from '../types/today-fortune.type';

@Injectable()
export class TodayFortuneService {
  constructor(private readonly fortuneClient: TodayFortuneClient) {}

  async getTodayFortune(rawInput: string): Promise<TodayFortune> {
    return this.getFortune(rawInput, FORTUNE_QUERIES.TODAY);
  }

  async getTomorrowFortune(rawInput: string): Promise<TodayFortune> {
    return this.getFortune(rawInput, FORTUNE_QUERIES.TOMORROW);
  }

  private async getFortune(
    rawInput: string,
    query: FortuneQuery,
  ): Promise<TodayFortune> {
    const parsedInput = parseFortuneInput(rawInput);

    try {
      const response = await this.fortuneClient.fetchFortuneResponse(
        query,
        parsedInput,
      );
      return parseFortuneResponse(response, query, parsedInput);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === INVALID_FORTUNE_INPUT ||
          error.message === INVALID_GENDER)
      ) {
        throw error;
      }

      throw new Error(createFortuneFetchFailedMessage(query));
    }
  }
}
