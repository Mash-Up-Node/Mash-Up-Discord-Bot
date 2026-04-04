import { StudySession } from '../entities/study-session.entity';

describe('StudySession Entity', () => {
  it('활성 세션을 생성할 수 있다 (leftAt, duration이 null)', () => {
    const session: StudySession = {
      id: 'test-id',
      userId: '123456789',
      channelId: '987654321',
      joinedAt: new Date('2026-04-01T10:00:00Z'),
      leftAt: null,
      duration: null,
    };

    expect(session.id).toBe('test-id');
    expect(session.userId).toBe('123456789');
    expect(session.channelId).toBe('987654321');
    expect(session.joinedAt).toBeInstanceOf(Date);
    expect(session.leftAt).toBeNull();
    expect(session.duration).toBeNull();
  });

  it('종료된 세션은 leftAt과 duration이 존재한다', () => {
    const session: StudySession = {
      id: 'test-id',
      userId: '123456789',
      channelId: '987654321',
      joinedAt: new Date('2026-04-01T10:00:00Z'),
      leftAt: new Date('2026-04-01T12:00:00Z'),
      duration: 7200,
    };

    expect(session.leftAt).toBeInstanceOf(Date);
    expect(session.duration).toBe(7200);
  });
});
