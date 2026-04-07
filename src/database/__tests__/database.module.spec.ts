import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database.module';
import {
  STUDY_SESSION_REPOSITORY,
  StudySessionRepository,
} from '../../modules/study/interfaces/study-session.repository';
import { SqliteStudySessionRepository } from '../repositories/sqlite-study-session.repository';
import { SupabaseStudySessionRepository } from '../repositories/supabase-study-session.repository';

describe('DatabaseModule', () => {
  afterEach(() => {
    delete process.env.DB_TYPE;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  it('DB_TYPE=sqlite이면 SqliteStudySessionRepository를 제공한다', async () => {
    process.env.DB_TYPE = 'sqlite';

    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule.forRoot()],
    }).compile();

    const repo: StudySessionRepository = module.get(STUDY_SESSION_REPOSITORY);
    expect(repo).toBeInstanceOf(SqliteStudySessionRepository);

    await module.close();
  });

  it('DB_TYPE=supabase이면 SupabaseStudySessionRepository를 제공한다', async () => {
    process.env.DB_TYPE = 'supabase';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';

    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule.forRoot()],
    }).compile();

    const repo: StudySessionRepository = module.get(STUDY_SESSION_REPOSITORY);
    expect(repo).toBeInstanceOf(SupabaseStudySessionRepository);

    await module.close();
  });

  it('DB_TYPE이 없으면 에러를 던진다', () => {
    delete process.env.DB_TYPE;

    expect(() => DatabaseModule.forRoot()).toThrow();
  });

  it('잘못된 DB_TYPE이면 에러를 던진다', () => {
    process.env.DB_TYPE = 'mysql';

    expect(() => DatabaseModule.forRoot()).toThrow('Unsupported DB_TYPE');
  });
});
