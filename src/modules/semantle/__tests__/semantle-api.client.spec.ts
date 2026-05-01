import { HttpSemantleApiClient } from '../semantle-api.client';

const originalFetch = global.fetch;

describe('HttpSemantleApiClient', () => {
  let client: HttpSemantleApiClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new HttpSemantleApiClient();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('오늘 퍼즐 정보를 조회한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          answer_id: 1485,
          '1st_score': 0.5066384077072144,
          '10th_score': 0.45334914326667786,
          '1000th_score': 0.2307651787996292,
          previous: { answer_id: 1484, key: '놀랍다' },
        }),
    });

    const result = await client.fetchToday();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe('https://semantle-ko.newsjel.ly/today');
    expect(options.headers).toEqual({ Accept: 'application/json' });
    expect(result.answer_id).toBe(1485);
    expect(result.previous.key).toBe('놀랍다');
  });

  it('추측 단어를 URL 인코딩해서 제출한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          guess: '사람',
          sim: 0.13175931572914124,
          rank: '1000위 이상',
        }),
    });

    const result = await client.guess(1485, '사람');
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe(
      'https://semantle-ko.newsjel.ly/guess/1485/%EC%82%AC%EB%9E%8C',
    );
    expect(result).toEqual({
      guess: '사람',
      sim: 0.13175931572914124,
      rank: '1000위 이상',
    });
  });

  it('API 에러 응답의 description을 포함해 에러를 던진다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({
          detail: {
            type: 'InvalidGuess',
            description: '처리할 수 없는 입력입니다.',
          },
        }),
    });

    await expect(client.guess(1485, '없는단어zzzzz')).rejects.toThrow(
      'Semantle API error: 404 for guess "없는단어zzzzz" on answer 1485 (처리할 수 없는 입력입니다.)',
    );
  });

  it('타임아웃 에러를 Semantle API 타임아웃 메시지로 변환한다', async () => {
    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error('timeout'), { name: 'TimeoutError' }),
    );

    await expect(client.fetchToday()).rejects.toThrow(
      'Semantle API timeout for today',
    );
  });
});
