import { SupabaseStudySessionRepository } from '../repositories/supabase-study-session.repository';

function createMockSupabase() {
  const chainable = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };

  const mock = {
    from: jest.fn().mockReturnValue(chainable),
    rpc: jest.fn(),
    _chain: chainable,
  };

  return mock;
}

describe('SupabaseStudySessionRepository', () => {
  let repo: SupabaseStudySessionRepository;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    repo = new SupabaseStudySessionRepository(mockSupabase as never);
  });

  describe('createSession', () => {
    it('새 세션을 생성하고 반환한다', async () => {
      mockSupabase._chain.select.mockReturnThis();
      mockSupabase._chain.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.from.mockReturnValue({
        ...mockSupabase._chain,
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'test-id',
                user_id: 'user-1',
                channel_id: 'channel-1',
                joined_at: '2026-04-01T10:00:00Z',
                left_at: null,
                duration: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const session = await repo.createSession('user-1', 'channel-1');

      expect(session.userId).toBe('user-1');
      expect(session.channelId).toBe('channel-1');
      expect(session.leftAt).toBeNull();
      expect(session.duration).toBeNull();
    });
  });

  describe('getActiveSession', () => {
    it('활성 세션이 없으면 null을 반환한다', async () => {
      mockSupabase._chain.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const session = await repo.getActiveSession('user-1');
      expect(session).toBeNull();
    });

    it('활성 세션이 있으면 해당 세션을 반환한다', async () => {
      mockSupabase._chain.maybeSingle.mockResolvedValue({
        data: {
          id: 'test-id',
          user_id: 'user-1',
          channel_id: 'channel-1',
          joined_at: '2026-04-01T10:00:00Z',
          left_at: null,
          duration: null,
        },
        error: null,
      });

      const session = await repo.getActiveSession('user-1');
      expect(session).not.toBeNull();
      expect(session!.userId).toBe('user-1');
    });
  });

  describe('endSession', () => {
    it('활성 세션이 없으면 null을 반환한다', async () => {
      mockSupabase._chain.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await repo.endSession('user-1');
      expect(result).toBeNull();
    });

    it('활성 세션을 종료하고 duration을 계산한다', async () => {
      mockSupabase._chain.maybeSingle.mockResolvedValue({
        data: {
          id: 'test-id',
          user_id: 'user-1',
          channel_id: 'channel-1',
          joined_at: new Date(Date.now() - 3600000).toISOString(),
          left_at: null,
          duration: null,
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        ...mockSupabase._chain,
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await repo.endSession('user-1');
      expect(result).not.toBeNull();
      expect(result!.leftAt).toBeInstanceOf(Date);
      expect(typeof result!.duration).toBe('number');
      expect(result!.duration).toBeGreaterThan(0);
    });
  });

  describe('getTotalDuration', () => {
    it('세션이 없으면 0을 반환한다', async () => {
      mockSupabase._chain.not.mockResolvedValue({
        data: [],
        error: null,
      });

      const total = await repo.getTotalDuration('user-1');
      expect(total).toBe(0);
    });

    it('종료된 세션들의 duration 합계를 반환한다', async () => {
      mockSupabase._chain.not.mockResolvedValue({
        data: [{ duration: 3600 }, { duration: 1800 }],
        error: null,
      });

      const total = await repo.getTotalDuration('user-1');
      expect(total).toBe(5400);
    });
  });

  describe('getActiveSessionsAll', () => {
    it('활성 세션이 없으면 빈 배열을 반환한다', async () => {
      mockSupabase._chain.is.mockResolvedValue({
        data: [],
        error: null,
      });

      const sessions = await repo.getActiveSessionsAll();
      expect(sessions).toEqual([]);
    });
  });

  describe('getLeaderboard', () => {
    it('기록이 없으면 빈 배열을 반환한다', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const leaderboard = await repo.getLeaderboard(10);
      expect(leaderboard).toEqual([]);
    });

    it('순위표를 반환한다', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { user_id: 'user-1', total: 7200 },
          { user_id: 'user-2', total: 3600 },
        ],
        error: null,
      });

      const leaderboard = await repo.getLeaderboard(10);
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].userId).toBe('user-1');
      expect(leaderboard[0].total).toBe(7200);
    });
  });
});
