import { TodayFortuneClient } from '../clients/today-fortune.client';
import { TodayWeatherClient } from '../clients/today-weather.client';
import { FORTUNE_QUERIES } from '../constants/today.constants';
import {
  createFortuneFetchFailedMessage,
  INVALID_FORTUNE_INPUT,
  WEATHER_FETCH_FAILED,
} from '../constants/today.messages';
import { TodayService } from '../today.service';

const originalFetch = global.fetch;
const runLiveFortuneTest = process.env.RUN_LIVE_FORTUNE_TEST === '1';
const FORTUNE_JSONP_RESPONSE =
  'fortuneCallback({ "flick" : ["<dl class=\\"infor _innerPanel\\"><dt class=\\"blind\\">총운<\\/dt><dd><strong>운세의 총운은 <b>일석삼조<\\/b> 입니다<\\/strong><span class=\\"result_date\\">2026.04.05<\\/span><p>좋은 일이 겹쳐 들어오는 날입니다.<\\/p><\\/dd><\\/dl>", "<dl class=\\"infor _innerPanel\\"><dt class=\\"blind\\">총운<\\/dt><dd><strong>운세의 총운은 <b>순망치한<\\/b> 입니다<\\/strong><span class=\\"result_date\\">2026.04.06<\\/span><p>말과 행동이 일치하도록 노력할 필요가 있는 날입니다.<\\/p><\\/dd><\\/dl>"] });';

describe('TodayService', () => {
  let service: TodayService;
  let weatherClient: Record<string, jest.Mock>;
  let fortuneClient: Record<string, jest.Mock>;

  beforeEach(() => {
    weatherClient = {
      searchLocation: jest.fn(),
      getForecast: jest.fn(),
      getAirQuality: jest.fn(),
    };
    fortuneClient = {
      fetchFortuneResponse: jest.fn(),
    };

    service = new TodayService(
      weatherClient as unknown as TodayWeatherClient,
      fortuneClient as unknown as TodayFortuneClient,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('위치를 해석한 뒤 날씨와 미세먼지 정보를 반환한다', async () => {
    weatherClient.searchLocation.mockResolvedValue({
      name: '서울',
      admin1: '서울특별시',
      country: '대한민국',
      latitude: 37.5665,
      longitude: 126.978,
      timezone: 'Asia/Seoul',
    });
    weatherClient.getForecast.mockResolvedValue({
      current: {
        temperature_2m: 17.2,
        apparent_temperature: 16.4,
        weather_code: 1,
        is_day: 1,
        wind_speed_10m: 11.3,
      },
    });
    weatherClient.getAirQuality.mockResolvedValue({
      current: {
        pm10: 28.5,
        pm2_5: 14.2,
        european_aqi: 32,
      },
    });

    const result = await service.getTodaySummary('서울');

    expect(weatherClient.searchLocation).toHaveBeenCalledWith('서울');
    expect(weatherClient.getForecast).toHaveBeenCalledWith(37.5665, 126.978);
    expect(weatherClient.getAirQuality).toHaveBeenCalledWith(37.5665, 126.978);
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

  it('원본 지역 조회가 실패하면 영문 별칭으로 재시도한다', async () => {
    weatherClient.searchLocation
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        name: '서울특별시',
        admin1: '서울특별시',
        country: '대한민국',
        latitude: 37.566,
        longitude: 126.9784,
        timezone: 'Asia/Seoul',
      });
    weatherClient.getForecast.mockResolvedValue({
      current: {
        temperature_2m: 17.2,
        apparent_temperature: 16.4,
        weather_code: 1,
        is_day: 1,
        wind_speed_10m: 11.3,
      },
    });
    weatherClient.getAirQuality.mockResolvedValue({
      current: {
        pm10: 28.5,
        pm2_5: 14.2,
        european_aqi: 32,
      },
    });

    const result = await service.getTodaySummary('서울');

    expect(weatherClient.searchLocation).toHaveBeenNthCalledWith(1, '서울');
    expect(weatherClient.searchLocation).toHaveBeenNthCalledWith(2, 'Seoul');
    expect(result.locationName).toBe('서울특별시, 대한민국');
  });

  it('위치를 찾지 못하면 안내 메시지를 던진다', async () => {
    weatherClient.searchLocation
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(service.getTodaySummary('없는도시')).rejects.toThrow(
      '없는도시 지역을 찾지 못했습니다.',
    );
  });

  it('지오코딩 API 호출이 실패하면 공통 에러를 던진다', async () => {
    weatherClient.searchLocation.mockRejectedValue(
      new Error('Open-Meteo geocoding failed'),
    );

    await expect(service.getTodaySummary('서울')).rejects.toThrow(
      WEATHER_FETCH_FAILED,
    );
  });

  it('날씨 또는 공기질 API 호출이 실패하면 공통 에러를 던진다', async () => {
    weatherClient.searchLocation.mockResolvedValue({
      name: '서울',
      country: '대한민국',
      latitude: 37.5665,
      longitude: 126.978,
      timezone: 'Asia/Seoul',
    });
    weatherClient.getForecast.mockRejectedValue(new Error('Forecast failed'));
    weatherClient.getAirQuality.mockResolvedValue({
      current: {
        pm10: 28.5,
        pm2_5: 14.2,
        european_aqi: 32,
      },
    });

    await expect(service.getTodaySummary('서울')).rejects.toThrow(
      WEATHER_FETCH_FAILED,
    );
  });

  it('운세 입력을 파싱해 오늘 운세를 반환한다', async () => {
    fortuneClient.fetchFortuneResponse.mockResolvedValue(
      FORTUNE_JSONP_RESPONSE,
    );

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
    fortuneClient.fetchFortuneResponse.mockResolvedValue(
      FORTUNE_JSONP_RESPONSE,
    );

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

  // 목 기반 테스트만으로는 네이버 HTML 마크업 변경을 감지할 수 없어서
  // 필요할 때 실제 응답을 점검할 수 있는 opt-in live test를 남겨둔다.
  const liveTest = runLiveFortuneTest ? it : it.skip;

  liveTest(
    '실제 네이버 API 응답을 받아 오늘 운세를 파싱한다',
    async () => {
      global.fetch = originalFetch;

      const liveService = new TodayService(
        {
          searchLocation: jest.fn(),
          getForecast: jest.fn(),
          getAirQuality: jest.fn(),
        } as unknown as TodayWeatherClient,
        new TodayFortuneClient(),
      );

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

      const liveService = new TodayService(
        {
          searchLocation: jest.fn(),
          getForecast: jest.fn(),
          getAirQuality: jest.fn(),
        } as unknown as TodayWeatherClient,
        new TodayFortuneClient(),
      );

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
