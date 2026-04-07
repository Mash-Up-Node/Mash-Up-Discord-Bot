import { DataSource, Repository } from 'typeorm';
import { StudySessionEntity } from '../entities/study-session.entity';
import { StudySessionTypeormRepository } from '../repositories/study-session.typeorm-repository';

const TEST_USER_ID = '__test_user_e2e_999999__';
const TEST_CHANNEL_ID = '__test_channel_e2e_999999__';

describe('StudySessionTypeormRepository (Supabase e2e)', () => {
  let dataSource: DataSource;
  let repo: StudySessionTypeormRepository;
  let typeormRepo: Repository<StudySessionEntity>;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error('DATABASE_URL 환경변수가 필요합니다.');
    }

    dataSource = new DataSource({
      type: 'postgres',
      url,
      entities: [StudySessionEntity],
      synchronize: false,
    });
    await dataSource.initialize();
    typeormRepo = dataSource.getRepository(StudySessionEntity);
    repo = new StudySessionTypeormRepository(typeormRepo);
  });

  afterAll(async () => {
    await typeormRepo.delete({ userId: TEST_USER_ID });
    await dataSource.destroy();
  });

  afterEach(async () => {
    await typeormRepo.delete({ userId: TEST_USER_ID });
  });

  it('Supabase에 연결할 수 있다', () => {
    expect(dataSource.isInitialized).toBe(true);
  });

  it('세션을 생성하고 조회할 수 있다', async () => {
    const session = await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID);

    expect(session.userId).toBe(TEST_USER_ID);
    expect(session.channelId).toBe(TEST_CHANNEL_ID);
    expect(session.leftAt).toBeNull();

    const active = await repo.getActiveSession(TEST_USER_ID);
    expect(active).not.toBeNull();
    expect(active!.id).toBe(session.id);
  });

  it('세션을 종료하면 duration이 계산된다', async () => {
    await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID);
    const ended = await repo.endSession(TEST_USER_ID);

    expect(ended).not.toBeNull();
    expect(ended!.leftAt).toBeInstanceOf(Date);
    expect(typeof ended!.duration).toBe('number');
    expect(ended!.duration).toBeGreaterThanOrEqual(0);
  });

  it('종료 후 활성 세션이 없다', async () => {
    await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID);
    await repo.endSession(TEST_USER_ID);

    const active = await repo.getActiveSession(TEST_USER_ID);
    expect(active).toBeNull();
  });

  it('누적 시간을 조회할 수 있다', async () => {
    await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID);
    await repo.endSession(TEST_USER_ID);

    const total = await repo.getTotalDuration(TEST_USER_ID);
    expect(typeof total).toBe('number');
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it('순위표를 조회할 수 있다', async () => {
    await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID);
    await repo.endSession(TEST_USER_ID);

    const leaderboard = await repo.getLeaderboard(10);
    expect(Array.isArray(leaderboard)).toBe(true);
  });
});
