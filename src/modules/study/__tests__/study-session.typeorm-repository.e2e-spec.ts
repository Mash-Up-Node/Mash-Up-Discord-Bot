import { DataSource, Repository } from 'typeorm';
import { StudySessionEntity } from '../entities/study-session.entity';
import { CategoryEntity } from '../entities/category.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { TeamEntity } from '../../user/entities/team.entity';
import { Department } from '../../user/user.constants';
import { StudySessionTypeormRepository } from '../repositories/study-session.typeorm-repository';

const TEST_USER_ID = '__test_user_e2e_999999__';
const TEST_CHANNEL_ID = '__test_channel_e2e_999999__';
const TEST_CATEGORY_ID = '__test_category_e2e_999999__';

describe('StudySessionTypeormRepository (Supabase e2e)', () => {
  let dataSource: DataSource;
  let repo: StudySessionTypeormRepository;
  let typeormRepo: Repository<StudySessionEntity>;
  let userRepo: Repository<UserEntity>;
  let categoryRepo: Repository<CategoryEntity>;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error('DATABASE_URL 환경변수가 필요합니다.');
    }

    dataSource = new DataSource({
      type: 'postgres',
      url,
      entities: [StudySessionEntity, CategoryEntity, UserEntity, TeamEntity],
      synchronize: false,
    });
    await dataSource.initialize();
    typeormRepo = dataSource.getRepository(StudySessionEntity);
    userRepo = dataSource.getRepository(UserEntity);
    categoryRepo = dataSource.getRepository(CategoryEntity);
    repo = new StudySessionTypeormRepository(typeormRepo);

    await userRepo.save(
      userRepo.create({
        discordId: TEST_USER_ID,
        nickname: 'E2E Test User',
        generation: 0,
        department: Department.Unknown,
        isAdmin: false,
        teamId: null,
        score: 0,
      }),
    );
    await categoryRepo.save(
      categoryRepo.create({ categoryId: TEST_CATEGORY_ID, name: 'E2E Test' }),
    );
  });

  afterAll(async () => {
    await typeormRepo.delete({ userId: TEST_USER_ID });
    await categoryRepo.delete({ categoryId: TEST_CATEGORY_ID });
    await userRepo.delete({ discordId: TEST_USER_ID });
    await dataSource.destroy();
  });

  afterEach(async () => {
    await typeormRepo.delete({ userId: TEST_USER_ID });
  });

  it('Supabase에 연결할 수 있다', () => {
    expect(dataSource.isInitialized).toBe(true);
  });

  it('세션을 생성하고 조회할 수 있다', async () => {
    const session = await repo.createSession(
      TEST_USER_ID,
      TEST_CHANNEL_ID,
      TEST_CATEGORY_ID,
    );

    expect(session.userId).toBe(TEST_USER_ID);
    expect(session.channelId).toBe(TEST_CHANNEL_ID);
    expect(session.categoryId).toBe(TEST_CATEGORY_ID);
    expect(session.leftAt).toBeNull();

    const active = await repo.getActiveSession(TEST_USER_ID);
    expect(active).not.toBeNull();
    expect(active!.id).toBe(session.id);
  });

  it('세션을 종료하면 duration이 계산된다', async () => {
    await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID, TEST_CATEGORY_ID);
    const ended = await repo.endSession(TEST_USER_ID);

    expect(ended).not.toBeNull();
    expect(ended!.leftAt).toBeInstanceOf(Date);
    expect(typeof ended!.duration).toBe('number');
    expect(ended!.duration).toBeGreaterThanOrEqual(0);
  });

  it('종료 후 활성 세션이 없다', async () => {
    await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID, TEST_CATEGORY_ID);
    await repo.endSession(TEST_USER_ID);

    const active = await repo.getActiveSession(TEST_USER_ID);
    expect(active).toBeNull();
  });

  it('누적 시간을 조회할 수 있다', async () => {
    await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID, TEST_CATEGORY_ID);
    await repo.endSession(TEST_USER_ID);

    const total = await repo.getTotalDuration(TEST_USER_ID);
    expect(typeof total).toBe('number');
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it('순위표를 조회할 수 있다', async () => {
    await repo.createSession(TEST_USER_ID, TEST_CHANNEL_ID, TEST_CATEGORY_ID);
    await repo.endSession(TEST_USER_ID);

    const leaderboard = await repo.getLeaderboard(10);
    expect(Array.isArray(leaderboard)).toBe(true);
  });
});
