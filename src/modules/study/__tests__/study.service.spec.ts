import { Test, TestingModule } from '@nestjs/testing';
import { StudyService } from '../study.service';
import { STUDY_SESSION_REPOSITORY } from '../interfaces/study-session.repository';
import { StudySession } from '../entities/study-session.entity';

describe('StudyService', () => {
  let service: StudyService;
  let mockRepo: Record<string, jest.Mock>;

  const mockSession: StudySession = {
    id: 'session-1',
    userId: 'user-1',
    channelId: 'channel-1',
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyService,
        { provide: STUDY_SESSION_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<StudyService>(StudyService);
  });

  describe('handleJoin', () => {
    it('활성 세션이 없으면 새 세션을 생성한다', async () => {
      mockRepo.getActiveSession.mockResolvedValue(null);
      mockRepo.createSession.mockResolvedValue(mockSession);

      const result = await service.handleJoin('user-1', 'channel-1');

      expect(mockRepo.getActiveSession).toHaveBeenCalledWith('user-1');
      expect(mockRepo.createSession).toHaveBeenCalledWith(
        'user-1',
        'channel-1',
      );
      expect(result).toEqual(mockSession);
    });

    it('이미 활성 세션이 있으면 새 세션을 생성하지 않는다', async () => {
      mockRepo.getActiveSession.mockResolvedValue(mockSession);

      const result = await service.handleJoin('user-1', 'channel-1');

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

      const result = await service.handleMove('user-1', 'channel-2');

      expect(mockRepo.endSession).toHaveBeenCalledWith('user-1');
      expect(mockRepo.createSession).toHaveBeenCalledWith(
        'user-1',
        'channel-2',
      );
      expect(result).toEqual(newSession);
    });
  });

  describe('getTotalDuration', () => {
    it('누적 공부 시간을 반환한다', async () => {
      mockRepo.getTotalDuration.mockResolvedValue(7200);

      const result = await service.getTotalDuration('user-1');

      expect(result).toBe(7200);
    });
  });

  describe('getActiveSessionsAll', () => {
    it('모든 활성 세션을 반환한다', async () => {
      mockRepo.getActiveSessionsAll.mockResolvedValue([mockSession]);

      const result = await service.getActiveSessionsAll();

      expect(result).toHaveLength(1);
    });
  });
});
