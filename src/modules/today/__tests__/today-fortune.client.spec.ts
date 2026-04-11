import { TodayFortuneClient } from '../clients/today-fortune.client';
import { FORTUNE_QUERIES } from '../constants/today.constants';

const originalFetch = global.fetch;

describe('TodayFortuneClient', () => {
  let client: TodayFortuneClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new TodayFortuneClient();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('운세 조회 시 네이버 JSONP 쿼리를 구성한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('fortuneCallback({ "flick": [] });'),
    });

    const response = await client.fetchFortuneResponse(FORTUNE_QUERIES.TODAY, {
      genderCode: 'm',
      genderLabel: '남자',
      birthDate: '2025-05-18',
      birthDateCompact: '20250518',
    });
    const [url] = fetchMock.mock.calls[0] as [URL];

    expect(url.toString()).toContain(
      'https://ts-proxy.naver.com/content/apirender.nhn',
    );
    expect(url.searchParams.get('where')).toBe('nexearch');
    expect(url.searchParams.get('pkid')).toBe('387');
    expect(url.searchParams.get('_callback')).toBe('fortuneCallback');
    expect(url.searchParams.get('q')).toBe(FORTUNE_QUERIES.TODAY);
    expect(url.searchParams.get('u1')).toBe('m');
    expect(url.searchParams.get('u2')).toBe('20250518');
    expect(url.searchParams.get('u3')).toBe('solar');
    expect(response).toContain('fortuneCallback');
  });

  it('네이버 응답이 실패하면 상태 코드를 포함한 에러를 던진다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(
      client.fetchFortuneResponse(FORTUNE_QUERIES.TODAY, {
        genderCode: 'm',
        genderLabel: '남자',
        birthDate: '2025-05-18',
        birthDateCompact: '20250518',
      }),
    ).rejects.toThrow('Naver request failed: 500');
  });
});
