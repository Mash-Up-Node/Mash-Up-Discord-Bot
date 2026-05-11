import { Injectable } from '@nestjs/common';
import { TodayFortuneClient } from '../clients/today-fortune.client';
import { FORTUNE_QUERIES, FortuneQuery } from '../constants/today.constants';
import {
  createFortuneFetchFailedMessage,
  INVALID_BIRTH_DATE,
} from '../constants/today.messages';
import { FortuneGenderInput } from '../dto/today-fortune-query.dto';
import {
  buildFortuneInput,
  parseFortuneResponse,
} from '../parsers/fortune.parser';
import { TodayFortune } from '../types/today-fortune.type';

@Injectable()
export class TodayFortuneService {
  constructor(private readonly fortuneClient: TodayFortuneClient) {}

  async getTodayFortune(
    gender: FortuneGenderInput,
    birthDate: string,
  ): Promise<TodayFortune> {
    return this.getFortune(gender, birthDate, FORTUNE_QUERIES.TODAY);
  }

  async getTomorrowFortune(
    gender: FortuneGenderInput,
    birthDate: string,
  ): Promise<TodayFortune> {
    return this.getFortune(gender, birthDate, FORTUNE_QUERIES.TOMORROW);
  }

  private async getFortune(
    gender: FortuneGenderInput,
    birthDate: string,
    query: FortuneQuery,
  ): Promise<TodayFortune> {
    const parsedInput = buildFortuneInput(gender, birthDate);

    try {
      const response = await this.fortuneClient.fetchFortuneResponse(
        query,
        parsedInput,
      );
      return parseFortuneResponse(response, query, parsedInput);
    } catch (error) {
      // 사용자 입력 검증 에러는 그대로 노출하고,
      // 공급자 호출/파싱 실패는 사용자용 공통 메시지로 변환한다.
      if (error instanceof Error && error.message === INVALID_BIRTH_DATE) {
        throw error;
      }

      throw new Error(createFortuneFetchFailedMessage(query));
    }
  }
}
