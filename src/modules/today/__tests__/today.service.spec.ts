import { TodayService } from '../today.service';

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
});
