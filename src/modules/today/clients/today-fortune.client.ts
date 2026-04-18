import { Injectable } from '@nestjs/common';
import {
  FortuneQuery,
  NAVER_FORTUNE_ENDPOINT,
} from '../constants/today.constants';
import { ParsedFortuneInput } from '../parsers/fortune-input.parser';

@Injectable()
export class TodayFortuneClient {
  // 운세 조회용 네이버 JSONP 응답 요청
  async fetchFortuneResponse(
    query: FortuneQuery,
    input: ParsedFortuneInput,
  ): Promise<string> {
    const url = new URL(NAVER_FORTUNE_ENDPOINT);
    url.searchParams.set('where', 'nexearch');
    url.searchParams.set('pkid', '387');
    url.searchParams.set('_callback', 'fortuneCallback');
    url.searchParams.set('q', query);
    url.searchParams.set('u1', input.genderCode);
    url.searchParams.set('u2', input.birthDateCompact);
    url.searchParams.set('u3', 'solar');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Naver request failed: ${response.status}`);
    }

    return response.text();
  }
}
