import { DataSource, Repository } from 'typeorm';
import { StudySessionEntity } from '../entities/study-session.entity';
import { StudySessionTypeormRepository } from '../repositories/study-session.typeorm-repository';

describe('StudySessionTypeormRepository', () => {
  let dataSource: DataSource;
  let repo: StudySessionTypeormRepository;
  let typeormRepo: Repository<StudySessionEntity>;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [StudySessionEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    typeormRepo = dataSource.getRepository(StudySessionEntity);
    repo = new StudySessionTypeormRepository(typeormRepo);
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  describe('createSession', () => {
    it('새 세션을 생성하고 반환한다', async () => {
      const session = await repo.createSession('user-1', 'channel-1', 'cat-1');

      expect(session.userId).toBe('user-1');
      expect(session.channelId).toBe('channel-1');
      expect(session.categoryId).toBe('cat-1');
      expect(session.joinedAt).toBeInstanceOf(Date);
      expect(session.leftAt).toBeNull();
      expect(session.duration).toBeNull();
    });

    it('id가 생성된다', async () => {
      const session = await repo.createSession('user-1', 'channel-1', 'cat-1');
      expect(session.id).toBeDefined();
      expect(session.id.length).toBeGreaterThan(0);
    });
  });

  describe('getActiveSession', () => {
    it('활성 세션이 없으면 null을 반환한다', async () => {
      const session = await repo.getActiveSession('user-1');
      expect(session).toBeNull();
    });

    it('활성 세션이 있으면 해당 세션을 반환한다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      const session = await repo.getActiveSession('user-1');

      expect(session).not.toBeNull();
      expect(session!.userId).toBe('user-1');
    });
  });

  describe('endSession', () => {
    it('활성 세션이 없으면 null을 반환한다', async () => {
      const result = await repo.endSession('user-1');
      expect(result).toBeNull();
    });

    it('활성 세션을 종료하고 duration을 계산한다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      const ended = await repo.endSession('user-1');

      expect(ended).not.toBeNull();
      expect(ended!.leftAt).toBeInstanceOf(Date);
      expect(typeof ended!.duration).toBe('number');
      expect(ended!.duration).toBeGreaterThanOrEqual(0);
    });

    it('종료된 세션은 getActiveSession에서 조회되지 않는다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      await repo.endSession('user-1');

      const active = await repo.getActiveSession('user-1');
      expect(active).toBeNull();
    });
  });

  describe('getTotalDuration', () => {
    it('세션이 없으면 0을 반환한다', async () => {
      const total = await repo.getTotalDuration('user-1');
      expect(total).toBe(0);
    });

    it('종료된 세션들의 duration 합계를 반환한다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      await repo.endSession('user-1');

      await repo.createSession('user-1', 'channel-2', 'cat-1');
      await repo.endSession('user-1');

      const total = await repo.getTotalDuration('user-1');
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThanOrEqual(0);
    });

    it('categoryId가 지정되면 해당 카테고리 세션만 합산한다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      await repo.endSession('user-1');
      await repo.createSession('user-1', 'channel-2', 'cat-2');
      await repo.endSession('user-1');

      const allTotal = await repo.getTotalDuration('user-1');
      const cat1Total = await repo.getTotalDuration('user-1', 'cat-1');
      const cat2Total = await repo.getTotalDuration('user-1', 'cat-2');
      const cat3Total = await repo.getTotalDuration('user-1', 'cat-3');

      expect(cat1Total + cat2Total).toBe(allTotal);
      expect(cat3Total).toBe(0);
    });
  });

  describe('getActiveSessionsAll', () => {
    it('활성 세션이 없으면 빈 배열을 반환한다', async () => {
      const sessions = await repo.getActiveSessionsAll();
      expect(sessions).toEqual([]);
    });

    it('모든 활성 세션을 반환한다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      await repo.createSession('user-2', 'channel-2', 'cat-1');

      const sessions = await repo.getActiveSessionsAll();
      expect(sessions).toHaveLength(2);
    });

    it('종료된 세션은 포함하지 않는다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      await repo.createSession('user-2', 'channel-2', 'cat-1');
      await repo.endSession('user-1');

      const sessions = await repo.getActiveSessionsAll();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].userId).toBe('user-2');
    });
  });

  describe('getLeaderboard', () => {
    it('기록이 없으면 빈 배열을 반환한다', async () => {
      const leaderboard = await repo.getLeaderboard(10);
      expect(leaderboard).toEqual([]);
    });

    it('limit만큼만 반환한다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      await repo.endSession('user-1');
      await repo.createSession('user-2', 'channel-1', 'cat-1');
      await repo.endSession('user-2');

      const leaderboard = await repo.getLeaderboard(1);
      expect(leaderboard).toHaveLength(1);
    });

    it('categoryId가 지정되면 해당 카테고리 사용자만 집계한다', async () => {
      await repo.createSession('user-1', 'channel-1', 'cat-1');
      await repo.endSession('user-1');
      await repo.createSession('user-2', 'channel-1', 'cat-2');
      await repo.endSession('user-2');

      const cat1Board = await repo.getLeaderboard(10, 'cat-1');
      const cat2Board = await repo.getLeaderboard(10, 'cat-2');

      expect(cat1Board.map((r) => r.userId)).toEqual(['user-1']);
      expect(cat2Board.map((r) => r.userId)).toEqual(['user-2']);
    });
  });
});
