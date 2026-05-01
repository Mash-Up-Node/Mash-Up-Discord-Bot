import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StudyService } from '../study.service';
import { STUDY_SESSION_REPOSITORY } from '../repositories/study-session.repository';
import { StudySession } from '../entities/study-session.entity';
import { ScoreService } from '../../score/score.service';

describe('StudyService', () => {
  let service: StudyService;
  let mockRepo: Record<string, jest.Mock>;
  let mockScoreService: { addScore: jest.Mock };

  const mockSession: StudySession = {
    id: 'session-1',
    userId: 'user-1',
    channelId: 'channel-1',
    categoryId: 'cat-1',
    joinedAt: new Date('2026-04-01T10:00:00Z'),
    leftAt: null,
    duration: null,
  };

  beforeEach(async () => {
    mockRepo = {
      createSession: jest.fn(),
      endSession: jest.fn(),
      getActiveSession: jest.fn(),
      getTotalDuration: jest.fn(),
      getActiveSessionsAll: jest.fn(),
      getLeaderboard: jest.fn(),
    };

    mockScoreService = {
      addScore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyService,
        { provide: STUDY_SESSION_REPOSITORY, useValue: mockRepo },
        { provide: ScoreService, useValue: mockScoreService },
      ],
    }).compile();

    service = module.get<StudyService>(StudyService);
  });

  describe('handleJoin', () => {
    it('활성 세션이 없으면 새 세션을 생성한다', async () => {
      mockRepo.getActiveSession.mockResolvedValue(null);
      mockRepo.createSession.mockResolvedValue(mockSession);

      const result = await service.handleJoin('user-1', 'channel-1', 'cat-1');

      expect(mockRepo.getActiveSession).toHaveBeenCalledWith('user-1');
      expect(mockRepo.createSession).toHaveBeenCalledWith(
        'user-1',
        'channel-1',
        'cat-1',
      );
      expect(result).toEqual(mockSession);
    });

    it('이미 활성 세션이 있으면 새 세션을 생성하지 않는다', async () => {
      mockRepo.getActiveSession.mockResolvedValue(mockSession);

      const result = await service.handleJoin('user-1', 'channel-1', 'cat-1');

      expect(mockRepo.createSession).not.toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });
  });

  describe('handleLeave', () => {
    it('활성 세션을 종료한다', async () => {
      const endedSession = {
        ...mockSession,
        leftAt: new Date('2026-04-01T12:00:00Z'),
        duration: 7200,
      };
      mockRepo.endSession.mockResolvedValue(endedSession);

      const result = await service.handleLeave('user-1');

      expect(mockRepo.endSession).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(endedSession);
    });

    it('활성 세션이 없으면 null을 반환한다', async () => {
      mockRepo.endSession.mockResolvedValue(null);

      const result = await service.handleLeave('user-1');

      expect(result).toBeNull();
    });

    it('duration 1분당 10점을 적립한다', async () => {
      mockRepo.endSession.mockResolvedValue({
        ...mockSession,
        leftAt: new Date(),
        duration: 120,
      });

      await service.handleLeave('user-1');

      expect(mockScoreService.addScore).toHaveBeenCalledWith('user-1', 20);
    });

    it('1분 미만 세션은 점수를 적립하지 않는다', async () => {
      mockRepo.endSession.mockResolvedValue({
        ...mockSession,
        leftAt: new Date(),
        duration: 30,
      });

      await service.handleLeave('user-1');

      expect(mockScoreService.addScore).not.toHaveBeenCalled();
    });

    it('endSession이 null을 반환하면 점수를 적립하지 않는다', async () => {
      mockRepo.endSession.mockResolvedValue(null);

      await service.handleLeave('user-1');

      expect(mockScoreService.addScore).not.toHaveBeenCalled();
    });

    it('duration이 null이면 점수를 적립하지 않는다', async () => {
      mockRepo.endSession.mockResolvedValue({
        ...mockSession,
        leftAt: new Date(),
        duration: null,
      });

      await service.handleLeave('user-1');

      expect(mockScoreService.addScore).not.toHaveBeenCalled();
    });

    it('addScore가 throw해도 예외를 흡수하고 정상 종료한다', async () => {
      const endedSession = {
        ...mockSession,
        leftAt: new Date(),
        duration: 600,
      };
      mockRepo.endSession.mockResolvedValue(endedSession);
      mockScoreService.addScore.mockRejectedValue(new Error('DB down'));
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const result = await service.handleLeave('user-1');

      expect(result).toEqual(endedSession);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('handleMove', () => {
    it('기존 세션을 종료하고 새 세션을 생성한다', async () => {
      const endedSession = {
        ...mockSession,
        leftAt: new Date(),
        duration: 3600,
      };
      const newSession = {
        ...mockSession,
        id: 'session-2',
        channelId: 'channel-2',
      };

      mockRepo.endSession.mockResolvedValue(endedSession);
      mockRepo.createSession.mockResolvedValue(newSession);

      const result = await service.handleMove('user-1', 'channel-2', 'cat-2');

      expect(mockRepo.endSession).toHaveBeenCalledWith('user-1');
      expect(mockRepo.createSession).toHaveBeenCalledWith(
        'user-1',
        'channel-2',
        'cat-2',
      );
      expect(result).toEqual(newSession);
    });

    it('이동 시 종료된 세션의 점수를 적립한다', async () => {
      mockRepo.endSession.mockResolvedValue({
        ...mockSession,
        leftAt: new Date(),
        duration: 600,
      });
      mockRepo.createSession.mockResolvedValue(mockSession);

      await service.handleMove('user-1', 'channel-2', 'cat-2');

      expect(mockScoreService.addScore).toHaveBeenCalledWith('user-1', 100);
      expect(mockRepo.createSession).toHaveBeenCalled();
    });

    it('활성 세션이 없으면 점수 적립 없이 새 세션만 생성한다', async () => {
      mockRepo.endSession.mockResolvedValue(null);
      mockRepo.createSession.mockResolvedValue(mockSession);

      await service.handleMove('user-1', 'channel-2', 'cat-2');

      expect(mockScoreService.addScore).not.toHaveBeenCalled();
      expect(mockRepo.createSession).toHaveBeenCalledWith(
        'user-1',
        'channel-2',
        'cat-2',
      );
    });
  });

  describe('getTotalDuration', () => {
    it('누적 공부 시간을 반환한다', async () => {
      mockRepo.getTotalDuration.mockResolvedValue(7200);

      const result = await service.getTotalDuration('user-1');

      expect(mockRepo.getTotalDuration).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
      expect(result).toBe(7200);
    });

    it('categoryId를 repository로 전달한다', async () => {
      mockRepo.getTotalDuration.mockResolvedValue(3600);

      await service.getTotalDuration('user-1', 'cat-1');

      expect(mockRepo.getTotalDuration).toHaveBeenCalledWith('user-1', 'cat-1');
    });
  });

  describe('getActiveSessionsAll', () => {
    it('모든 활성 세션을 반환한다', async () => {
      mockRepo.getActiveSessionsAll.mockResolvedValue([mockSession]);

      const result = await service.getActiveSessionsAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('getLeaderboard', () => {
    it('순위표를 반환한다', async () => {
      const leaderboardData = [{ userId: 'user-1', total: 7200 }];
      mockRepo.getLeaderboard.mockResolvedValue(leaderboardData);

      const result = await service.getLeaderboard(10);

      expect(mockRepo.getLeaderboard).toHaveBeenCalledWith(10, undefined);
      expect(result).toEqual(leaderboardData);
    });

    it('categoryId를 repository로 전달한다', async () => {
      mockRepo.getLeaderboard.mockResolvedValue([]);

      await service.getLeaderboard(10, 'cat-1');

      expect(mockRepo.getLeaderboard).toHaveBeenCalledWith(10, 'cat-1');
    });
  });
});
