import { TodayService } from '../today.service';
import { FORTUNE_QUERIES } from '../constants/today.constants';
import {
  createFortuneFetchFailedMessage,
  INVALID_FORTUNE_INPUT,
  WEATHER_FETCH_FAILED,
} from '../constants/today.messages';

const originalFetch = global.fetch;
const runLiveFortuneTest = process.env.RUN_LIVE_FORTUNE_TEST === '1';
const FORTUNE_JSONP_RESPONSE =
  'fortuneCallback({ "flick" : ["<dl class=\\"infor _innerPanel\\"><dt class=\\"blind\\">총운<\\/dt><dd><strong>운세의 총운은 <b>일석삼조<\\/b> 입니다<\\/strong><span class=\\"result_date\\">2026.04.05<\\/span><p>좋은 일이 겹쳐 들어오는 날입니다.<\\/p><\\/dd><\\/dl>", "<dl class=\\"infor _innerPanel\\"><dt class=\\"blind\\">총운<\\/dt><dd><strong>운세의 총운은 <b>순망치한<\\/b> 입니다<\\/strong><span class=\\"result_date\\">2026.04.06<\\/span><p>말과 행동이 일치하도록 노력할 필요가 있는 날입니다.<\\/p><\\/dd><\\/dl>"] });';

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

  it('날씨 조회 시 외부 API를 기대한 쿼리로 호출한다', async () => {
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

    await service.getTodaySummary('서울');

    // fetch 순서는 geocoding -> forecast -> air-quality 이다.
    const [geocodingUrl, forecastUrl, airQualityUrl] = fetchMock.mock.calls.map(
      ([url]) => url as URL,
    );

    expect(geocodingUrl.toString()).toContain(
      'https://geocoding-api.open-meteo.com/v1/search',
    );
    expect(geocodingUrl.searchParams.get('name')).toBe('서울');
    expect(geocodingUrl.searchParams.get('count')).toBe('1');
    expect(geocodingUrl.searchParams.get('language')).toBe('ko');

    expect(forecastUrl.toString()).toContain('https://api.open-meteo.com/v1/forecast');
    expect(forecastUrl.searchParams.get('latitude')).toBe('37.5665');
    expect(forecastUrl.searchParams.get('longitude')).toBe('126.978');
    expect(forecastUrl.searchParams.get('timezone')).toBe('auto');
    expect(forecastUrl.searchParams.get('current')).toBe(
      'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    );

    expect(airQualityUrl.toString()).toContain(
      'https://air-quality-api.open-meteo.com/v1/air-quality',
    );
    expect(airQualityUrl.searchParams.get('latitude')).toBe('37.5665');
    expect(airQualityUrl.searchParams.get('longitude')).toBe('126.978');
    expect(airQualityUrl.searchParams.get('timezone')).toBe('auto');
    expect(airQualityUrl.searchParams.get('current')).toBe(
      'pm10,pm2_5,european_aqi',
    );
  });

  it('서울 한글 입력이면 영문 별칭으로 재조회한다', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                name: '서울특별시',
                admin1: '서울특별시',
                country: '대한민국',
                latitude: 37.566,
                longitude: 126.9784,
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
    const calls = fetchMock.mock.calls as Array<[URL]>;

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(calls[0][0].toString()).toContain('name=%EC%84%9C%EC%9A%B8');
    expect(calls[1][0].toString()).toContain('name=Seoul');
    expect(result.locationName).toBe('서울특별시, 대한민국');
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
      WEATHER_FETCH_FAILED,
    );
  });

  it('운세 입력을 파싱해 네이버 운세를 반환한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(FORTUNE_JSONP_RESPONSE),
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

  it('오늘 운세 조회 시 네이버 API를 기대한 쿼리로 호출한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(FORTUNE_JSONP_RESPONSE),
    });

    await service.getTodayFortune('남자,2025-05-18');

    const [fortuneUrl] = fetchMock.mock.calls[0] as [URL];

    expect(fortuneUrl.toString()).toContain(
      'https://ts-proxy.naver.com/content/apirender.nhn',
    );
    expect(fortuneUrl.searchParams.get('where')).toBe('nexearch');
    expect(fortuneUrl.searchParams.get('pkid')).toBe('387');
    expect(fortuneUrl.searchParams.get('_callback')).toBe('fortuneCallback');
    expect(fortuneUrl.searchParams.get('q')).toBe(FORTUNE_QUERIES.TODAY);
    expect(fortuneUrl.searchParams.get('u1')).toBe('m');
    expect(fortuneUrl.searchParams.get('u2')).toBe('20250518');
    expect(fortuneUrl.searchParams.get('u3')).toBe('solar');
  });

  it('내일 운세 입력을 파싱해 네이버 운세를 반환한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(FORTUNE_JSONP_RESPONSE),
    });

    const result = await service.getTomorrowFortune('남자,2025-05-18');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      keyword: '순망치한',
      date: '2026.04.06',
      summary: '말과 행동이 일치하도록 노력할 필요가 있는 날입니다.',
      gender: '남자',
      birthDate: '2025-05-18',
    });
  });

  it('운세 HTML 마크업이 바뀌면 공통 에러 메시지로 변환한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve(
          'fortuneCallback({ "flick" : ["<div>마크업이 바뀐 응답</div>"] });',
        ),
    });

    await expect(service.getTodayFortune('남자,2025-05-18')).rejects.toThrow(
      createFortuneFetchFailedMessage(FORTUNE_QUERIES.TODAY),
    );
  });

  it('운세 JSONP 형식이 깨지면 공통 에러 메시지로 변환한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('{ "flick": [] }'),
    });

    await expect(service.getTodayFortune('남자,2025-05-18')).rejects.toThrow(
      createFortuneFetchFailedMessage(FORTUNE_QUERIES.TODAY),
    );
  });

  it('운세 입력 형식이 잘못되면 안내 메시지를 던진다', async () => {
    await expect(service.getTodayFortune('남자 2025-05-18')).rejects.toThrow(
      INVALID_FORTUNE_INPUT,
    );
  });

  it('내일 운세 조회 실패 시 내일 운세 에러 메시지를 던진다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(service.getTomorrowFortune('남자,2025-05-18')).rejects.toThrow(
      createFortuneFetchFailedMessage(FORTUNE_QUERIES.TOMORROW),
    );
  });

  // 목 기반 테스트만으로는 네이버 HTML 마크업 변경을 감지할 수 없어서
  // 필요할 때 실제 응답을 점검할 수 있는 opt-in live test를 남겨둔다.
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

  liveTest(
    '실제 네이버 API 응답을 받아 내일 운세를 파싱한다',
    async () => {
      global.fetch = originalFetch;

      const result = await service.getTomorrowFortune('남자,2025-05-18');

      expect(result.gender).toBe('남자');
      expect(result.birthDate).toBe('2025-05-18');
      expect(result.keyword.length).toBeGreaterThan(0);
      expect(result.date).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
      expect(result.summary.length).toBeGreaterThan(20);
    },
    15000,
  );
});
