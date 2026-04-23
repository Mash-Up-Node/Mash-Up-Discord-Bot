import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../database.module';

describe('DatabaseModule', () => {
  afterEach(() => {
    delete process.env.DB_TYPE;
    delete process.env.SQLITE_PATH;
  });

  it('DB_TYPE=sqlite이면 DataSource가 생성된다', async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_PATH = ':memory:';

    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule.forRoot()],
    }).compile();

    const dataSource = module.get(DataSource);
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBe(true);

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
