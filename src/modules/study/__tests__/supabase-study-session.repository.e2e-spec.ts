import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStudySessionRepository } from '../repositories/supabase-study-session.repository';

const TEST_USER_ID = '__test_user_e2e_999999__';
const TEST_CHANNEL_ID = '__test_channel_e2e_999999__';

describe('SupabaseStudySessionRepository (e2e)', () => {
  let supabase: SupabaseClient;
  let repo: SupabaseStudySessionRepository;

  beforeAll(() => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL과 SUPABASE_ANON_KEY 환경변수가 필요합니다.',
      );
    }

    supabase = createClient(url, key);
    repo = new SupabaseStudySessionRepository(supabase);
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await supabase.from('study_sessions').delete().eq('user_id', TEST_USER_ID);
  });

  afterEach(async () => {
    // 각 테스트 후 테스트 유저 데이터 정리
    await supabase.from('study_sessions').delete().eq('user_id', TEST_USER_ID);
  });

  it('Supabase에 연결할 수 있다', async () => {
    const { error } = await supabase
      .from('study_sessions')
      .select('id')
      .limit(1);

    expect(error).toBeNull();
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
