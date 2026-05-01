import { Injectable } from '@nestjs/common';

export interface SemantlePreviousAnswer {
  answer_id: number;
  key: string;
}

export interface SemantleTodayResponse {
  answer_id: number;
  '1st_score': number;
  '10th_score': number;
  '1000th_score': number;
  previous: SemantlePreviousAnswer;
}

export type SemantleGuessRank = number | '정답!' | '1000위 이상';

export interface SemantleGuessResponse {
  guess: string;
  sim: number;
  rank: SemantleGuessRank;
}

interface SemantleErrorResponse {
  detail?:
    | string
    | {
        type?: string;
        description?: string;
      };
}

export interface SemantleApiErrorDetail {
  type?: string;
  description?: string;
}

export class SemantleApiError extends Error {
  constructor(
    readonly status: number,
    readonly context: string,
    readonly detail: SemantleApiErrorDetail | null = null,
  ) {
    const suffix = detail?.description ?? detail?.type;
    super(
      `Semantle API error: ${status} for ${context}${suffix ? ` (${suffix})` : ''}`,
    );
    this.name = 'SemantleApiError';
  }
}

export interface SemantleApiClient {
  fetchToday(): Promise<SemantleTodayResponse>;
  guess(answerId: number, value: string): Promise<SemantleGuessResponse>;
}

export const SEMANTLE_API_CLIENT = Symbol('SEMANTLE_API_CLIENT');

@Injectable()
export class HttpSemantleApiClient implements SemantleApiClient {
  async fetchToday(): Promise<SemantleTodayResponse> {
    return this.getJson<SemantleTodayResponse>('/today', 'today');
  }

  async guess(answerId: number, value: string): Promise<SemantleGuessResponse> {
    const encodedAnswerId = encodeURIComponent(String(answerId));
    const encodedValue = encodeURIComponent(value);

    return this.getJson<SemantleGuessResponse>(
      `/guess/${encodedAnswerId}/${encodedValue}`,
      `guess "${value}" on answer ${answerId}`,
    );
  }

  private async getJson<T>(path: string, context: string): Promise<T> {
    try {
      const res = await fetch(`https://semantle-ko.newsjel.ly${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const detail = await this.getErrorDetail(res);
        throw new SemantleApiError(res.status, context, detail);
      }

      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof Error && /^(Abort|Timeout)Error$/.test(error.name)) {
        throw new Error(`Semantle API timeout for ${context}`);
      }
      throw error;
    }
  }

  private async getErrorDetail(
    res: Response,
  ): Promise<SemantleApiErrorDetail | null> {
    try {
      const body = (await res.json()) as SemantleErrorResponse;
      if (typeof body.detail === 'string') {
        return { description: body.detail };
      }
      return body.detail || null;
    } catch {
      return null;
    }
  }
}
