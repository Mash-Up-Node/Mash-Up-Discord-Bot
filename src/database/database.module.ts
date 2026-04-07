import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SQLITE_DATABASE, SUPABASE_CLIENT } from './database.constants';
import { sqliteProvider } from './sqlite.provider';
import { supabaseProvider } from './supabase.provider';
import { STUDY_SESSION_REPOSITORY } from '../modules/study/interfaces/study-session.repository';
import { SqliteStudySessionRepository } from '../modules/study/repositories/sqlite-study-session.repository';
import { SupabaseStudySessionRepository } from '../modules/study/repositories/supabase-study-session.repository';
import type Database from 'better-sqlite3';
import type { SupabaseClient } from '@supabase/supabase-js';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const dbType = process.env.DB_TYPE;

    if (!dbType) {
      throw new Error('DB_TYPE 환경변수가 설정되지 않았습니다.');
    }

    const providers: Provider[] = [];
    const exports: symbol[] = [STUDY_SESSION_REPOSITORY];

    if (dbType === 'sqlite') {
      providers.push(sqliteProvider, {
        provide: STUDY_SESSION_REPOSITORY,
        inject: [SQLITE_DATABASE],
        useFactory: (db: Database.Database) =>
          new SqliteStudySessionRepository(db),
      });
      exports.push(SQLITE_DATABASE);
    } else if (dbType === 'supabase') {
      providers.push(supabaseProvider, {
        provide: STUDY_SESSION_REPOSITORY,
        inject: [SUPABASE_CLIENT],
        useFactory: (client: SupabaseClient) =>
          new SupabaseStudySessionRepository(client),
      });
      exports.push(SUPABASE_CLIENT);
    } else {
      throw new Error(`Unsupported DB_TYPE: ${dbType}`);
    }

    return {
      module: DatabaseModule,
      imports: [ConfigModule],
      providers,
      exports,
      global: true,
    };
  }
}
