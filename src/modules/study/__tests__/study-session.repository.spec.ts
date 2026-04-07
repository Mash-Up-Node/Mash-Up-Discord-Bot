import { StudySession } from '../entities/study-session.entity';
import {
  STUDY_SESSION_REPOSITORY,
  StudySessionRepository,
} from '../repositories/study-session.repository';

describe('StudySessionRepository Interface', () => {
  it('STUDY_SESSION_REPOSITORY 토큰이 Symbol이다', () => {
    expect(typeof STUDY_SESSION_REPOSITORY).toBe('symbol');
  });

  it('인터페이스 계약을 만족하는 mock 구현체를 만들 수 있다', async () => {
    const mockSession: StudySession = {
      id: 'test-id',
      userId: 'user-1',
      channelId: 'channel-1',
      joinedAt: new Date(),
      leftAt: null,
      duration: null,
    };

    const mockRepo: StudySessionRepository = {
      createSession: jest.fn().mockResolvedValue(mockSession),
      endSession: jest.fn().mockResolvedValue({
        ...mockSession,
        leftAt: new Date(),
        duration: 3600,
      }),
      getActiveSession: jest.fn().mockResolvedValue(mockSession),
      getTotalDuration: jest.fn().mockResolvedValue(7200),
      getActiveSessionsAll: jest.fn().mockResolvedValue([mockSession]),
      getLeaderboard: jest
        .fn()
        .mockResolvedValue([{ userId: 'user-1', total: 7200 }]),
    };

    // createSession
    const created = await mockRepo.createSession('user-1', 'channel-1');
    expect(created.userId).toBe('user-1');
    expect(created.leftAt).toBeNull();

    // endSession
    const ended = await mockRepo.endSession('user-1');
    expect(ended).not.toBeNull();
    expect(ended!.duration).toBe(3600);

    // getActiveSession
    const active = await mockRepo.getActiveSession('user-1');
    expect(active).not.toBeNull();

    // getTotalDuration
    const total = await mockRepo.getTotalDuration('user-1');
    expect(total).toBe(7200);

    // getActiveSessionsAll
    const allActive = await mockRepo.getActiveSessionsAll();
    expect(allActive).toHaveLength(1);
  });
});
