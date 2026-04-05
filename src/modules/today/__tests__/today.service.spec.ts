import { TodayService } from '../today.service';

const originalFetch = global.fetch;
const runLiveFortuneTest = process.env.RUN_LIVE_FORTUNE_TEST === '1';

describe('TodayService', () => {
  let service: TodayService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new TodayService();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('위치를 조회한 뒤 날씨와 미세먼지 정보를 반환한다', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                name: '서울',
                admin1: '서울특별시',
                country: '대한민국',
                latitude: 37.5665,
                longitude: 126.978,
                timezone: 'Asia/Seoul',
              },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              temperature_2m: 17.2,
              apparent_temperature: 16.4,
              weather_code: 1,
              is_day: 1,
              wind_speed_10m: 11.3,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              pm10: 28.5,
              pm2_5: 14.2,
              european_aqi: 32,
            },
          }),
      });

    const result = await service.getTodaySummary('서울');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      locationName: '서울, 서울특별시, 대한민국',
      timezone: 'Asia/Seoul',
      temperature: 17.2,
      apparentTemperature: 16.4,
      weatherCode: 1,
      isDay: true,
      windSpeed: 11.3,
      pm10: 28.5,
      pm2_5: 14.2,
      europeanAqi: 32,
    });
  });

  it('위치를 찾지 못하면 안내 메시지를 던진다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await expect(service.getTodaySummary('없는도시')).rejects.toThrow(
      '없는도시 지역을 찾지 못했습니다.',
    );
  });

  it('외부 API 호출이 실패하면 공통 에러를 던진다', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                name: '서울',
                country: '대한민국',
                latitude: 37.5665,
                longitude: 126.978,
                timezone: 'Asia/Seoul',
              },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current: {
              pm10: 28.5,
              pm2_5: 14.2,
              european_aqi: 32,
            },
          }),
      });

    await expect(service.getTodaySummary('서울')).rejects.toThrow(
      '오늘 날씨 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
    );
  });

  it('운세 입력을 파싱해 네이버 운세를 반환한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve(
          'fortuneCallback({ "flick" : ["<dl class=\\"infor _innerPanel\\"><dt class=\\"blind\\">총운<\\/dt><dd><strong>운세의 총운은 <b>일석삼조<\\/b> 입니다<\\/strong><span class=\\"result_date\\">2026.04.05<\\/span><p>좋은 일이 겹쳐 들어오는 날입니다.<\\/p><\\/dd><\\/dl>"] });',
        ),
    });

    const result = await service.getTodayFortune('남자,2025-05-18');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      keyword: '일석삼조',
      date: '2026.04.05',
      summary: '좋은 일이 겹쳐 들어오는 날입니다.',
      gender: '남자',
      birthDate: '2025-05-18',
    });
  });

  it('운세 입력 형식이 잘못되면 안내 메시지를 던진다', async () => {
    await expect(service.getTodayFortune('남자 2025-05-18')).rejects.toThrow(
      '운세 형식은 "남자,2025-05-18" 입니다.',
    );
  });

  const liveTest = runLiveFortuneTest ? it : it.skip;

  liveTest(
    '실제 네이버 API 응답을 받아 운세를 파싱한다',
    async () => {
      global.fetch = originalFetch;

      const result = await service.getTodayFortune('남자,2025-05-18');

      expect(result.gender).toBe('남자');
      expect(result.birthDate).toBe('2025-05-18');
      expect(result.keyword.length).toBeGreaterThan(0);
      expect(result.date).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
      expect(result.summary.length).toBeGreaterThan(20);
    },
    15000,
  );
});
