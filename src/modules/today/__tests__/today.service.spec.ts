import { TodayFortuneService } from '../services/today-fortune.service';
import { TodayWeatherService } from '../services/today-weather.service';
import { TodayService } from '../today.service';

describe('TodayService', () => {
  let service: TodayService;
  let weatherService: Record<string, jest.Mock>;
  let fortuneService: Record<string, jest.Mock>;

  beforeEach(() => {
    weatherService = {
      getTodaySummary: jest.fn(),
    };
    fortuneService = {
      getTodayFortune: jest.fn(),
      getTomorrowFortune: jest.fn(),
    };
    service = new TodayService(
      weatherService as unknown as TodayWeatherService,
      fortuneService as unknown as TodayFortuneService,
    );
  });

  it('날씨 조회를 weather service에 위임한다', async () => {
    const summary = {
      locationName: '서울, 대한민국',
      timezone: 'Asia/Seoul',
      temperature: 17.2,
      apparentTemperature: 16.4,
      weatherCode: 1,
      isDay: true,
      windSpeed: 11.3,
      pm10: 28.5,
      pm2_5: 14.2,
      europeanAqi: 32,
    };
    weatherService.getTodaySummary.mockResolvedValue(summary);

    await expect(service.getTodaySummary('서울')).resolves.toEqual(summary);
    expect(weatherService.getTodaySummary).toHaveBeenCalledWith('서울');
  });

  it('오늘 운세 조회를 fortune service에 위임한다', async () => {
    const fortune = {
      keyword: '일석삼조',
      date: '2026.04.05',
      summary: '좋은 일이 겹쳐 들어오는 날입니다.',
      gender: '남자' as const,
      birthDate: '2025-05-18',
    };
    fortuneService.getTodayFortune.mockResolvedValue(fortune);

    await expect(service.getTodayFortune('남자,2025-05-18')).resolves.toEqual(
      fortune,
    );
    expect(fortuneService.getTodayFortune).toHaveBeenCalledWith(
      '남자,2025-05-18',
    );
  });

  it('내일 운세 조회를 fortune service에 위임한다', async () => {
    const fortune = {
      keyword: '순망치한',
      date: '2026.04.06',
      summary: '말과 행동이 일치하도록 노력할 필요가 있는 날입니다.',
      gender: '남자' as const,
      birthDate: '2025-05-18',
    };
    fortuneService.getTomorrowFortune.mockResolvedValue(fortune);

    await expect(
      service.getTomorrowFortune('남자,2025-05-18'),
    ).resolves.toEqual(fortune);
    expect(fortuneService.getTomorrowFortune).toHaveBeenCalledWith(
      '남자,2025-05-18',
    );
  });
});
