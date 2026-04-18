import { TodayWeatherClient } from '../clients/today-weather.client';
import { WEATHER_FETCH_FAILED } from '../constants/today.messages';
import { TodayWeatherService } from '../services/today-weather.service';

describe('TodayWeatherService', () => {
  let service: TodayWeatherService;
  let weatherClient: Record<string, jest.Mock>;

  beforeEach(() => {
    weatherClient = {
      searchLocation: jest.fn(),
      getForecast: jest.fn(),
      getAirQuality: jest.fn(),
    };

    service = new TodayWeatherService(
      weatherClient as unknown as TodayWeatherClient,
    );
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
});
