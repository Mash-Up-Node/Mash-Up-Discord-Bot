import { TodayQueryDto } from '../dto/today-query.dto';
import { TodayCommands } from '../today.commands';
import { TodayService } from '../today.service';

describe('TodayCommands', () => {
  let commands: TodayCommands;
  let mockService: Record<string, jest.Mock>;

  function createMockInteraction() {
    return {
      reply: jest.fn(),
    };
  }

  beforeEach(() => {
    mockService = {
      getTodaySummary: jest.fn(),
      getTodayFortune: jest.fn(),
      getTomorrowFortune: jest.fn(),
    };

    commands = new TodayCommands(mockService as unknown as TodayService);
  });

  it('지역 옵션이 없으면 서울을 기준으로 조회한다', async () => {
    mockService.getTodaySummary.mockResolvedValue({
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
    const dto = new TodayQueryDto();

    await commands.onToday([interaction] as never, dto);

    expect(mockService.getTodaySummary).toHaveBeenCalledWith('서울');
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('공기질: 양호') as string,
      }),
    );
  });

  it('지역 옵션이 있으면 해당 지역으로 조회한다', async () => {
    mockService.getTodaySummary.mockResolvedValue({
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
    const dto = new TodayQueryDto();
    dto.location = '부산';

    await commands.onToday([interaction] as never, dto);

    expect(mockService.getTodaySummary).toHaveBeenCalledWith('부산');
  });

  it('서비스 에러를 사용자에게 전달한다', async () => {
    mockService.getTodaySummary.mockRejectedValue(
      new Error('오늘 정보를 가져오지 못했습니다.'),
    );
    const interaction = createMockInteraction();
    const dto = new TodayQueryDto();

    await commands.onToday([interaction] as never, dto);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: '오늘 정보를 가져오지 못했습니다.',
    });
  });

  it('운세 옵션이 있으면 운세 조회를 우선한다', async () => {
    mockService.getTodayFortune.mockResolvedValue({
      keyword: '일석삼조',
      date: '2026.04.05',
      summary: '좋은 일이 겹쳐 들어오는 날입니다.',
      gender: '남자',
      birthDate: '2025-05-18',
    });
    const interaction = createMockInteraction();
    const dto = new TodayQueryDto();
    dto.fortune = '남자,2025-05-18';
    dto.location = '부산';

    await commands.onToday([interaction] as never, dto);

    expect(mockService.getTodayFortune).toHaveBeenCalledWith('남자,2025-05-18');
    expect(mockService.getTodaySummary).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('오늘의 운세') as string,
      }),
    );
  });

  it('내일운세 옵션이 있으면 내일 운세 조회를 우선한다', async () => {
    mockService.getTomorrowFortune.mockResolvedValue({
      keyword: '순망치한',
      date: '2026.04.06',
      summary: '말과 행동이 일치하도록 노력할 필요가 있는 날입니다.',
      gender: '남자',
      birthDate: '2025-05-18',
    });
    const interaction = createMockInteraction();
    const dto = new TodayQueryDto();
    dto.tomorrowFortune = '남자,2025-05-18';
    dto.fortune = '남자,2025-05-18';

    await commands.onToday([interaction] as never, dto);

    expect(mockService.getTomorrowFortune).toHaveBeenCalledWith(
      '남자,2025-05-18',
    );
    expect(mockService.getTodayFortune).not.toHaveBeenCalled();
    expect(mockService.getTodaySummary).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('내일의 운세') as string,
      }),
    );
  });
});
