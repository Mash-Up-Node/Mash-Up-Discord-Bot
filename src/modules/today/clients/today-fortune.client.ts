import { Injectable } from '@nestjs/common';
import {
  FortuneQuery,
  NAVER_FORTUNE_ENDPOINT,
} from '../constants/today.constants';
import { ParsedFortuneInput } from '../parsers/fortune.parser';

@Injectable()
export class TodayFortuneClient {
  // 운세 조회용 네이버 JSONP 응답 요청
  async fetchFortuneResponse(
    query: FortuneQuery,
    input: ParsedFortuneInput,
  ): Promise<string> {
    const fortuneUrl = new URL(NAVER_FORTUNE_ENDPOINT);
    fortuneUrl.searchParams.set('where', 'nexearch');
    fortuneUrl.searchParams.set('pkid', '387');
    fortuneUrl.searchParams.set('_callback', 'fortuneCallback');
    fortuneUrl.searchParams.set('q', query);
    fortuneUrl.searchParams.set('u1', input.genderCode);
    fortuneUrl.searchParams.set('u2', input.birthDateCompact);
    fortuneUrl.searchParams.set('u3', 'solar');

    const fortuneResponse = await fetch(fortuneUrl);

    if (!fortuneResponse.ok) {
      throw new Error(`Naver request failed: ${fortuneResponse.status}`);
    }

    return fortuneResponse.text();
  }
}
