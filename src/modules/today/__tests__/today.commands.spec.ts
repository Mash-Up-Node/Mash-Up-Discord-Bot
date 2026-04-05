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
        content: expect.stringContaining('서울, 대한민국') as string,
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
});
