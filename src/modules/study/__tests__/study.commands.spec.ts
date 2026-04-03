import { StudyCommands } from '../study.commands';
import { StudyService } from '../study.service';

describe('StudyCommands', () => {
  let commands: StudyCommands;
  let mockService: Record<string, jest.Mock>;
  let mockInteraction: Record<string, jest.Mock | Record<string, string>>;

  beforeEach(() => {
    mockService = {
      getTotalDuration: jest.fn(),
      handleJoin: jest.fn(),
      handleLeave: jest.fn(),
      handleMove: jest.fn(),
      getActiveSessionsAll: jest.fn(),
    };

    mockInteraction = {
      user: { id: 'user-1' },
      reply: jest.fn(),
    };

    commands = new StudyCommands(mockService as unknown as StudyService);
  });

  describe('/공부시간', () => {
    it('누적 시간이 0이면 기록이 없다고 안내한다', async () => {
      mockService.getTotalDuration.mockResolvedValue(0);

      await commands.onStudyTime([mockInteraction] as never);

      expect(mockService.getTotalDuration).toHaveBeenCalledWith('user-1');
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('기록이 없') as string,
        }),
      );
    });

    it('누적 시간을 시/분/초 형식으로 표시한다', async () => {
      // 2시간 30분 45초 = 9045초
      mockService.getTotalDuration.mockResolvedValue(9045);

      await commands.onStudyTime([mockInteraction] as never);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/2시간 30분 45초/) as string,
        }),
      );
    });

    it('1시간 미만이면 시간을 생략한다', async () => {
      // 15분 30초 = 930초
      mockService.getTotalDuration.mockResolvedValue(930);

      await commands.onStudyTime([mockInteraction] as never);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/15분 30초/) as string,
        }),
      );
    });
  });
});
