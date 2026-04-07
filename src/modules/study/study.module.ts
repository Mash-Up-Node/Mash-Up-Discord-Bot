import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  SQLITE_DATABASE,
  SUPABASE_CLIENT,
} from '../../database/database.constants';
import { STUDY_SESSION_REPOSITORY } from './repositories/study-session.repository';
import { SqliteStudySessionRepository } from './repositories/sqlite-study-session.repository';
import { SupabaseStudySessionRepository } from './repositories/supabase-study-session.repository';
import { StudyService } from './study.service';
import { StudyListener } from './study.listener';
import { StudyCommands } from './study.commands';
import type Database from 'better-sqlite3';
import type { SupabaseClient } from '@supabase/supabase-js';

function createSqliteRepository(): Provider {
  return {
    provide: STUDY_SESSION_REPOSITORY,
    inject: [SQLITE_DATABASE],
    useFactory: (db: Database.Database) => new SqliteStudySessionRepository(db),
  };
}

function createSupabaseRepository(): Provider {
  return {
    provide: STUDY_SESSION_REPOSITORY,
    inject: [SUPABASE_CLIENT],
    useFactory: (client: SupabaseClient) =>
      new SupabaseStudySessionRepository(client),
  };
}

@Module({})
export class StudyModule {
  static forRoot(): DynamicModule {
    const repositoryProvider =
      process.env.DB_TYPE === 'supabase'
        ? createSupabaseRepository()
        : createSqliteRepository();

    return {
      module: StudyModule,
      providers: [
        repositoryProvider,
        StudyService,
        StudyListener,
        StudyCommands,
      ],
    };
  }
}
