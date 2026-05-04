import { ScoreCommands } from '../score.commands';
import { ScoreService } from '../score.service';
import { Department } from '../../user/user.constants';
import { UserEntity } from '../../user/entities/user.entity';
import { TeamEntity } from '../../user/entities/team.entity';

describe('ScoreCommands', () => {
  let commands: ScoreCommands;
  let mockScoreService: Record<string, jest.Mock>;

  function createInteraction(userId = 'user-1') {
    return {
      user: { id: userId },
      reply: jest.fn(),
    };
  }

  const mockTeam: TeamEntity = { id: 1, name: '1조', members: [] };
  const mockUser: UserEntity = {
    discordId: 'user-1',
    nickname: '홍길동',
    generation: 16,
    department: Department.Node,
    isAdmin: false,
    teamId: 1,
    team: mockTeam,
    score: 30,
  };

  beforeEach(() => {
    mockScoreService = {
      getMyScore: jest.fn(),
      getTeamRanking: jest.fn(),
      resetAll: jest.fn(),
    };

    commands = new ScoreCommands(mockScoreService as unknown as ScoreService);
  });

  describe('/내-점수', () => {
    it('등록된 유저의 점수와 팀을 응답한다', async () => {
      mockScoreService.getMyScore.mockResolvedValue(mockUser);
      const interaction = createInteraction();

      await commands.onMyScore([interaction] as never);

      expect(mockScoreService.getMyScore).toHaveBeenCalledWith('user-1');
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('홍길동') as string,
          ephemeral: true,
        }),
      );
    });

    it('팀이 없으면 "미배정"으로 표시한다', async () => {
      mockScoreService.getMyScore.mockResolvedValue({
        ...mockUser,
        teamId: null,
        team: null,
      });
      const interaction = createInteraction();

      await commands.onMyScore([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('미배정') as string,
        }),
      );
    });

    it('등록되지 않은 유저는 안내 메시지를 응답한다', async () => {
      mockScoreService.getMyScore.mockResolvedValue(null);
      const interaction = createInteraction('unknown');

      await commands.onMyScore([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('등록되지 않은 유저') as string,
          ephemeral: true,
        }),
      );
    });
  });

  describe('/점수-랭킹', () => {
    it('팀 랭킹을 응답한다', async () => {
      mockScoreService.getTeamRanking.mockResolvedValue([
        { teamId: 1, teamName: '1조', totalScore: 100 },
        { teamId: 2, teamName: '2조', totalScore: 80 },
      ]);
      const interaction = createInteraction();

      await commands.onScoreRank([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('1. 1조 — 100점') as string,
        }),
      );
    });

    it('랭킹이 비어있으면 안내 메시지를 응답한다', async () => {
      mockScoreService.getTeamRanking.mockResolvedValue([]);
      const interaction = createInteraction();

      await commands.onScoreRank([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('아직 점수 기록이 없습니다') as string,
        }),
      );
    });
  });

  describe('/시즌-종료', () => {
    it('시즌을 종료하고 모든 점수와 팀을 초기화한다', async () => {
      const interaction = createInteraction();

      await commands.onSeasonEnd([interaction] as never);

      expect(mockScoreService.resetAll).toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('시즌이 종료') as string,
        }),
      );
    });
  });
});
