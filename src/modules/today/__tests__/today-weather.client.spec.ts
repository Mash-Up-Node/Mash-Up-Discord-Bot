import { TodayWeatherClient } from '../clients/today-weather.client';

const originalFetch = global.fetch;

describe('TodayWeatherClient', () => {
  let client: TodayWeatherClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new TodayWeatherClient();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('빈 지역명은 호출 없이 null을 반환한다', async () => {
    await expect(client.searchLocation('')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('지역 검색 시 Open-Meteo geocoding 쿼리를 구성한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            {
              name: '서울',
              latitude: 37.5665,
              longitude: 126.978,
              timezone: 'Asia/Seoul',
            },
          ],
        }),
    });

    const result = await client.searchLocation('서울');
    const [url] = fetchMock.mock.calls[0] as [URL];

    expect(url.toString()).toContain(
      'https://geocoding-api.open-meteo.com/v1/search',
    );
    expect(url.searchParams.get('name')).toBe('서울');
    expect(url.searchParams.get('count')).toBe('1');
    expect(url.searchParams.get('language')).toBe('ko');
    expect(result?.name).toBe('서울');
  });

  it('현재 날씨 조회 시 forecast 쿼리를 구성한다', async () => {
    fetchMock.mockResolvedValueOnce({
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
    });

    const result = await client.getForecast(37.5665, 126.978);
    const [url] = fetchMock.mock.calls[0] as [URL];

    expect(url.toString()).toContain('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('37.5665');
    expect(url.searchParams.get('longitude')).toBe('126.978');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    );
    expect(result.current?.weather_code).toBe(1);
  });

  it('현재 공기질 조회 시 air-quality 쿼리를 구성한다', async () => {
    fetchMock.mockResolvedValueOnce({
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

    const result = await client.getAirQuality(37.5665, 126.978);
    const [url] = fetchMock.mock.calls[0] as [URL];

    expect(url.toString()).toContain(
      'https://air-quality-api.open-meteo.com/v1/air-quality',
    );
    expect(url.searchParams.get('latitude')).toBe('37.5665');
    expect(url.searchParams.get('longitude')).toBe('126.978');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('current')).toBe('pm10,pm2_5,european_aqi');
    expect(result.current?.european_aqi).toBe(32);
  });

  it('Open-Meteo 응답이 실패하면 상태 코드를 포함한 에러를 던진다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(client.getForecast(37.5665, 126.978)).rejects.toThrow(
      'Open-Meteo request failed: 500',
    );
  });
});
