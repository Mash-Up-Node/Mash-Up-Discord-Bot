import { TodayFortuneClient } from '../clients/today-fortune.client';
import { FORTUNE_QUERIES } from '../constants/today.constants';
import {
  createFortuneFetchFailedMessage,
  INVALID_FORTUNE_INPUT,
} from '../constants/today.messages';
import { TodayFortuneService } from '../services/today-fortune.service';

const originalFetch = global.fetch;
const runLiveFortuneTest = process.env.RUN_LIVE_FORTUNE_TEST === '1';
const FORTUNE_JSONP_RESPONSE =
  'fortuneCallback({ "flick" : ["<dl class=\\"infor _innerPanel\\"><dt class=\\"blind\\">총운<\\/dt><dd><strong>운세의 총운은 <b>일석삼조<\\/b> 입니다<\\/strong><span class=\\"result_date\\">2026.04.05<\\/span><p>좋은 일이 겹쳐 들어오는 날입니다.<\\/p><\\/dd><\\/dl>", "<dl class=\\"infor _innerPanel\\"><dt class=\\"blind\\">총운<\\/dt><dd><strong>운세의 총운은 <b>순망치한<\\/b> 입니다<\\/strong><span class=\\"result_date\\">2026.04.06<\\/span><p>말과 행동이 일치하도록 노력할 필요가 있는 날입니다.<\\/p><\\/dd><\\/dl>"] });';

describe('TodayFortuneService', () => {
  let service: TodayFortuneService;
  let fortuneClient: Record<string, jest.Mock>;

  beforeEach(() => {
    fortuneClient = {
      fetchFortuneResponse: jest.fn(),
    };

    service = new TodayFortuneService(
      fortuneClient as unknown as TodayFortuneClient,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('운세 입력을 파싱해 오늘 운세를 반환한다', async () => {
    fortuneClient.fetchFortuneResponse.mockResolvedValue(FORTUNE_JSONP_RESPONSE);

    const result = await service.getTodayFortune('남자,2025-05-18');

    expect(fortuneClient.fetchFortuneResponse).toHaveBeenCalledWith(
      FORTUNE_QUERIES.TODAY,
      {
        genderCode: 'm',
        genderLabel: '남자',
        birthDate: '2025-05-18',
        birthDateCompact: '20250518',
      },
    );
    expect(result).toEqual({
      keyword: '일석삼조',
      date: '2026.04.05',
      summary: '좋은 일이 겹쳐 들어오는 날입니다.',
      gender: '남자',
      birthDate: '2025-05-18',
    });
  });

  it('운세 입력을 파싱해 내일 운세를 반환한다', async () => {
    fortuneClient.fetchFortuneResponse.mockResolvedValue(FORTUNE_JSONP_RESPONSE);

    const result = await service.getTomorrowFortune('남자,2025-05-18');

    expect(fortuneClient.fetchFortuneResponse).toHaveBeenCalledWith(
      FORTUNE_QUERIES.TOMORROW,
      {
        genderCode: 'm',
        genderLabel: '남자',
        birthDate: '2025-05-18',
        birthDateCompact: '20250518',
      },
    );
    expect(result).toEqual({
      keyword: '순망치한',
      date: '2026.04.06',
      summary: '말과 행동이 일치하도록 노력할 필요가 있는 날입니다.',
      gender: '남자',
      birthDate: '2025-05-18',
    });
  });

  it('운세 입력 형식이 잘못되면 클라이언트 호출 없이 안내 메시지를 던진다', async () => {
    await expect(service.getTodayFortune('남자 2025-05-18')).rejects.toThrow(
      INVALID_FORTUNE_INPUT,
    );

    expect(fortuneClient.fetchFortuneResponse).not.toHaveBeenCalled();
  });

  it('운세 HTML 마크업이 바뀌면 공통 에러 메시지로 변환한다', async () => {
    fortuneClient.fetchFortuneResponse.mockResolvedValue(
      'fortuneCallback({ "flick" : ["<div>마크업이 바뀐 응답</div>"] });',
    );

    await expect(service.getTodayFortune('남자,2025-05-18')).rejects.toThrow(
      createFortuneFetchFailedMessage(FORTUNE_QUERIES.TODAY),
    );
  });

  it('운세 JSONP 형식이 깨지면 공통 에러 메시지로 변환한다', async () => {
    fortuneClient.fetchFortuneResponse.mockResolvedValue('{ "flick": [] }');

    await expect(service.getTodayFortune('남자,2025-05-18')).rejects.toThrow(
      createFortuneFetchFailedMessage(FORTUNE_QUERIES.TODAY),
    );
  });

  it('내일 운세 조회 실패 시 내일 운세 에러 메시지를 던진다', async () => {
    fortuneClient.fetchFortuneResponse.mockRejectedValue(
      new Error('Naver request failed: 500'),
    );

    await expect(service.getTomorrowFortune('남자,2025-05-18')).rejects.toThrow(
      createFortuneFetchFailedMessage(FORTUNE_QUERIES.TOMORROW),
    );
  });

  const liveTest = runLiveFortuneTest ? it : it.skip;

  liveTest(
    '실제 네이버 API 응답을 받아 오늘 운세를 파싱한다',
    async () => {
      global.fetch = originalFetch;

      const liveService = new TodayFortuneService(new TodayFortuneClient());
      const result = await liveService.getTodayFortune('남자,2025-05-18');

      expect(result.gender).toBe('남자');
      expect(result.birthDate).toBe('2025-05-18');
      expect(result.keyword.length).toBeGreaterThan(0);
      expect(result.date).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
      expect(result.summary.length).toBeGreaterThan(20);
    },
    15000,
  );

  liveTest(
    '실제 네이버 API 응답을 받아 내일 운세를 파싱한다',
    async () => {
      global.fetch = originalFetch;

      const liveService = new TodayFortuneService(new TodayFortuneClient());
      const result = await liveService.getTomorrowFortune('남자,2025-05-18');

      expect(result.gender).toBe('남자');
      expect(result.birthDate).toBe('2025-05-18');
      expect(result.keyword.length).toBeGreaterThan(0);
      expect(result.date).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
      expect(result.summary.length).toBeGreaterThan(20);
    },
    15000,
  );
});
