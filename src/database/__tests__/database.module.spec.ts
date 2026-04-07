import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database.module';
import { SQLITE_DATABASE, SUPABASE_CLIENT } from '../database.constants';

describe('DatabaseModule', () => {
  afterEach(() => {
    delete process.env.DB_TYPE;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  it('DB_TYPE=sqlite이면 SQLITE_DATABASE를 제공한다', async () => {
    process.env.DB_TYPE = 'sqlite';

    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule.forRoot()],
    }).compile();

    const db: unknown = module.get(SQLITE_DATABASE);
    expect(db).toBeDefined();

    await module.close();
  });

  it('DB_TYPE=supabase이면 SUPABASE_CLIENT를 제공한다', async () => {
    process.env.DB_TYPE = 'supabase';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';

    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule.forRoot()],
    }).compile();

    const client: unknown = module.get(SUPABASE_CLIENT);
    expect(client).toBeDefined();

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
