import { TodayFortuneQueryDto } from '../dto/today-fortune-query.dto';
import { TodayWeatherQueryDto } from '../dto/today-weather-query.dto';
import { TodayCommands } from '../today.commands';
import { TodayFortuneService } from '../services/today-fortune.service';
import { TodayWeatherService } from '../services/today-weather.service';

describe('TodayCommands', () => {
  let commands: TodayCommands;
  let weatherService: Record<string, jest.Mock>;
  let fortuneService: Record<string, jest.Mock>;

  function createUnknownInteractionError() {
    return Object.assign(new Error('Unknown interaction'), { code: 10062 });
  }

  function createMockInteraction() {
    return {
      deferReply: jest.fn(),
      editReply: jest.fn(),
      reply: jest.fn(),
    };
  }

  beforeEach(() => {
    weatherService = {
      getTodaySummary: jest.fn(),
    };
    fortuneService = {
      getTodayFortune: jest.fn(),
      getTomorrowFortune: jest.fn(),
    };

    commands = new TodayCommands(
      weatherService as unknown as TodayWeatherService,
      fortuneService as unknown as TodayFortuneService,
    );
  });

  it('지역 옵션이 없으면 서울을 기준으로 조회한다', async () => {
    weatherService.getTodaySummary.mockResolvedValue({
      locationName: '서울, 대한민국',
      timezone: 'Asia/Seoul',
      temperature: 17.2,
      apparentTemperature: 16.4,
      weatherCode: 0,
      isDay: true,
      windSpeed: 11.3,
      pm10: 28.5,
      pm2_5: 14.2,
      europeanAqi: 32,
    });
    const interaction = createMockInteraction();
    const dto = new TodayWeatherQueryDto();

    await commands.onTodayWeather([interaction] as never, dto);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(weatherService.getTodaySummary).toHaveBeenCalledWith('서울');
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('공기질: 양호') as string,
      }),
    );
  });

  it('지역 옵션이 있으면 해당 지역으로 조회한다', async () => {
    weatherService.getTodaySummary.mockResolvedValue({
      locationName: '부산, 대한민국',
      timezone: 'Asia/Seoul',
      temperature: 19,
      apparentTemperature: 19,
      weatherCode: 3,
      isDay: true,
      windSpeed: 8,
      pm10: 22,
      pm2_5: 11,
      europeanAqi: 26,
    });
    const interaction = createMockInteraction();
    const dto = new TodayWeatherQueryDto();
    dto.location = '부산';

    await commands.onTodayWeather([interaction] as never, dto);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(weatherService.getTodaySummary).toHaveBeenCalledWith('부산');
  });

  it('서비스 에러를 사용자에게 전달한다', async () => {
    weatherService.getTodaySummary.mockRejectedValue(
      new Error('오늘 정보를 가져오지 못했습니다.'),
    );
    const interaction = createMockInteraction();
    const dto = new TodayWeatherQueryDto();

    await commands.onTodayWeather([interaction] as never, dto);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: '오늘 정보를 가져오지 못했습니다.',
    });
  });

  it('deferReply가 실패하면 reply로 에러를 전달한다', async () => {
    const interaction = createMockInteraction();
    interaction.deferReply.mockRejectedValue(new Error('상호작용 처리 실패'));
    const dto = new TodayWeatherQueryDto();

    await commands.onTodayWeather([interaction] as never, dto);

    expect(weatherService.getTodaySummary).not.toHaveBeenCalled();
    expect(interaction.editReply).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      content: '상호작용 처리 실패',
    });
  });

  it('Unknown interaction으로 deferReply가 실패하면 재응답하지 않는다', async () => {
    const interaction = createMockInteraction();
    interaction.deferReply.mockRejectedValue(createUnknownInteractionError());
    const dto = new TodayWeatherQueryDto();

    await expect(
      commands.onTodayWeather([interaction] as never, dto),
    ).resolves.toBeUndefined();

    expect(weatherService.getTodaySummary).not.toHaveBeenCalled();
    expect(interaction.reply).not.toHaveBeenCalled();
    expect(interaction.editReply).not.toHaveBeenCalled();
  });

  it('Unknown interaction으로 editReply가 실패하면 추가 재시도 없이 종료한다', async () => {
    weatherService.getTodaySummary.mockResolvedValue({
      locationName: '서울, 대한민국',
      timezone: 'Asia/Seoul',
      temperature: 17.2,
      apparentTemperature: 16.4,
      weatherCode: 0,
      isDay: true,
      windSpeed: 11.3,
      pm10: 28.5,
      pm2_5: 14.2,
      europeanAqi: 32,
    });
    const interaction = createMockInteraction();
    interaction.editReply.mockRejectedValue(createUnknownInteractionError());
    const dto = new TodayWeatherQueryDto();

    await expect(
      commands.onTodayWeather([interaction] as never, dto),
    ).resolves.toBeUndefined();

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledTimes(1);
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it('오늘운세 커맨드는 오늘 운세를 조회한다', async () => {
    fortuneService.getTodayFortune.mockResolvedValue({
      keyword: '일석삼조',
      date: '2026.04.05',
      summary: '좋은 일이 겹쳐 들어오는 날입니다.',
      gender: '남자',
      birthDate: '2025-05-18',
    });
    const interaction = createMockInteraction();
    const dto = new TodayFortuneQueryDto();
    dto.gender = 'male';
    dto.birthDate = '2025-05-18';

    await commands.onTodayFortune([interaction] as never, dto);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(fortuneService.getTodayFortune).toHaveBeenCalledWith(
      'male',
      '2025-05-18',
    );
    expect(weatherService.getTodaySummary).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('오늘의 운세') as string,
      }),
    );
  });

  it('내일운세 커맨드는 내일 운세를 조회한다', async () => {
    fortuneService.getTomorrowFortune.mockResolvedValue({
      keyword: '순망치한',
      date: '2026.04.06',
      summary: '말과 행동이 일치하도록 노력할 필요가 있는 날입니다.',
      gender: '남자',
      birthDate: '2025-05-18',
    });
    const interaction = createMockInteraction();
    const dto = new TodayFortuneQueryDto();
    dto.gender = 'male';
    dto.birthDate = '2025-05-18';

    await commands.onTomorrowFortune([interaction] as never, dto);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(fortuneService.getTomorrowFortune).toHaveBeenCalledWith(
      'male',
      '2025-05-18',
    );
    expect(fortuneService.getTodayFortune).not.toHaveBeenCalled();
    expect(weatherService.getTodaySummary).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('내일의 운세') as string,
      }),
    );
  });
});
