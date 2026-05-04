import { StudyCommands } from '../study.commands';
import { StudyService } from '../study.service';
import { CategoryService } from '../category.service';
import { StudyTimeDto } from '../dto/study-time.dto';
import { LeaderboardDto } from '../dto/leaderboard.dto';

describe('StudyCommands', () => {
  let commands: StudyCommands;
  let mockService: Record<string, jest.Mock>;
  let mockCategoryService: Record<string, jest.Mock>;

  function createMockInteraction() {
    return {
      user: { id: 'user-1', displayName: '최재영' },
      reply: jest.fn(),
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({ displayName: '최재영' }),
        },
      },
    };
  }

  beforeEach(() => {
    mockService = {
      getTotalDuration: jest.fn(),
      getLeaderboard: jest.fn(),
      handleJoin: jest.fn(),
      handleLeave: jest.fn(),
      handleMove: jest.fn(),
      getActiveSessionsAll: jest.fn(),
    };

    mockCategoryService = {
      has: jest.fn(),
    };

    commands = new StudyCommands(
      mockService as unknown as StudyService,
      mockCategoryService as unknown as CategoryService,
    );
  });

  describe('/공부시간', () => {
    it('누적 시간이 0이면 기록이 없다고 안내한다', async () => {
      mockService.getTotalDuration.mockResolvedValue(0);
      const interaction = createMockInteraction();
      const dto = new StudyTimeDto();

      await commands.onStudyTime([interaction] as never, dto);

      expect(mockService.getTotalDuration).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('기록이 없') as string,
        }),
      );
    });

    it('닉네임과 함께 누적 시간을 표시한다', async () => {
      mockService.getTotalDuration.mockResolvedValue(9045);
      const interaction = createMockInteraction();
      const dto = new StudyTimeDto();

      await commands.onStudyTime([interaction] as never, dto);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('최재영') as string,
        }),
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/2시간 30분 45초/) as string,
        }),
      );
    });

    it('다른 사용자를 지정하면 해당 사용자의 시간을 조회한다', async () => {
      mockService.getTotalDuration.mockResolvedValue(3600);
      const interaction = createMockInteraction();
      const dto = new StudyTimeDto();
      dto.user = { id: 'user-2', displayName: '공진성' } as never;

      await commands.onStudyTime([interaction] as never, dto);

      expect(mockService.getTotalDuration).toHaveBeenCalledWith(
        'user-2',
        undefined,
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('공진성') as string,
        }),
      );
    });

    it('등록된 카테고리 지정 시 해당 카테고리 id로 조회하고 이름을 메시지에 포함한다', async () => {
      mockCategoryService.has.mockReturnValue(true);
      mockService.getTotalDuration.mockResolvedValue(3600);
      const interaction = createMockInteraction();
      const dto = new StudyTimeDto();
      dto.category = { id: 'cat-1', name: 'Node' } as never;

      await commands.onStudyTime([interaction] as never, dto);

      expect(mockCategoryService.has).toHaveBeenCalledWith('cat-1');
      expect(mockService.getTotalDuration).toHaveBeenCalledWith(
        'user-1',
        'cat-1',
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Node') as string,
        }),
      );
    });

    it('등록되지 않은 카테고리면 안내 메시지를 보내고 조회하지 않는다', async () => {
      mockCategoryService.has.mockReturnValue(false);
      const interaction = createMockInteraction();
      const dto = new StudyTimeDto();
      dto.category = { id: 'cat-x', name: 'Unknown' } as never;

      await commands.onStudyTime([interaction] as never, dto);

      expect(mockService.getTotalDuration).not.toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('등록되지 않은') as string,
        }),
      );
    });
  });

  describe('/공부순위', () => {
    it('기록이 없으면 안내 메시지를 보낸다', async () => {
      mockService.getLeaderboard.mockResolvedValue([]);
      const interaction = createMockInteraction();
      const dto = new LeaderboardDto();

      await commands.onLeaderboard([interaction] as never, dto);

      expect(mockService.getLeaderboard).toHaveBeenCalledWith(
        expect.any(Number),
        undefined,
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('기록이 없') as string,
        }),
      );
    });

    it('순위표를 표시한다', async () => {
      mockService.getLeaderboard.mockResolvedValue([
        { userId: 'user-1', total: 7200 },
        { userId: 'user-2', total: 3600 },
      ]);
      const interaction = createMockInteraction();
      const dto = new LeaderboardDto();

      await commands.onLeaderboard([interaction] as never, dto);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('순위표') as string,
        }),
      );
    });

    it('등록된 카테고리 지정 시 해당 카테고리 id로 조회하고 제목에 이름을 포함한다', async () => {
      mockCategoryService.has.mockReturnValue(true);
      mockService.getLeaderboard.mockResolvedValue([
        { userId: 'user-1', total: 7200 },
      ]);
      const interaction = createMockInteraction();
      const dto = new LeaderboardDto();
      dto.category = { id: 'cat-1', name: 'Node' } as never;

      await commands.onLeaderboard([interaction] as never, dto);

      expect(mockService.getLeaderboard).toHaveBeenCalledWith(
        expect.any(Number),
        'cat-1',
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Node') as string,
        }),
      );
    });

    it('등록되지 않은 카테고리면 안내 메시지를 보내고 조회하지 않는다', async () => {
      mockCategoryService.has.mockReturnValue(false);
      const interaction = createMockInteraction();
      const dto = new LeaderboardDto();
      dto.category = { id: 'cat-x', name: 'Unknown' } as never;

      await commands.onLeaderboard([interaction] as never, dto);

      expect(mockService.getLeaderboard).not.toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('등록되지 않은') as string,
        }),
      );
    });
  });

  describe('/팀공부순위', () => {
    function createMockInteractionWithChannel(
      channel: Record<string, unknown> | null,
    ) {
      return {
        ...createMockInteraction(),
        channel,
      };
    }

    it('카테고리에 속하지 않은 채널이면 안내 메시지를 보낸다', async () => {
      const interaction = createMockInteractionWithChannel({
        parentId: null,
      });

      await commands.onTeamLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('팀 카테고리 내 채널') as string,
        }),
      );
    });

    it('channel이 null이면 안내 메시지를 보낸다', async () => {
      const interaction = createMockInteractionWithChannel(null);

      await commands.onTeamLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('팀 카테고리 내 채널') as string,
        }),
      );
    });

    it('등록되지 않은 공부 카테고리면 안내 메시지를 보낸다', async () => {
      mockCategoryService.has.mockReturnValue(false);
      const interaction = createMockInteractionWithChannel({
        parentId: 'cat-unknown',
      });

      await commands.onTeamLeaderboard([interaction] as never);

      expect(mockCategoryService.has).toHaveBeenCalledWith('cat-unknown');
      expect(mockService.getLeaderboard).not.toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining(
            '등록된 공부 카테고리가 아닙니다',
          ) as string,
        }),
      );
    });

    it('기록이 없으면 안내 메시지를 보낸다', async () => {
      mockCategoryService.has.mockReturnValue(true);
      mockService.getLeaderboard.mockResolvedValue([]);
      const interaction = createMockInteractionWithChannel({
        parentId: 'cat-1',
      });

      await commands.onTeamLeaderboard([interaction] as never);

      expect(mockService.getLeaderboard).toHaveBeenCalledWith(
        expect.any(Number),
        'cat-1',
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('공부 기록이 없') as string,
        }),
      );
    });

    it('카테고리명과 함께 순위표를 표시한다', async () => {
      mockCategoryService.has.mockReturnValue(true);
      mockService.getLeaderboard.mockResolvedValue([
        { userId: 'user-1', total: 7200 },
      ]);
      const interaction = createMockInteractionWithChannel({
        parentId: 'cat-1',
        parent: { name: '1조' },
      });

      await commands.onTeamLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('1조 공부 시간 순위표') as string,
        }),
      );
    });

    it('parent가 없으면 기본 제목으로 표시한다', async () => {
      mockCategoryService.has.mockReturnValue(true);
      mockService.getLeaderboard.mockResolvedValue([
        { userId: 'user-1', total: 3600 },
      ]);
      const interaction = createMockInteractionWithChannel({
        parentId: 'cat-1',
        parent: null,
      });

      await commands.onTeamLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('팀 공부 시간 순위표') as string,
        }),
      );
    });
  });
});
