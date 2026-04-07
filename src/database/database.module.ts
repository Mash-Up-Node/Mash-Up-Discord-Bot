import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SQLITE_DATABASE, SUPABASE_CLIENT } from './database.constants';
import { sqliteProvider } from './providers/sqlite.provider';
import { supabaseProvider } from './providers/supabase.provider';
import { DATABASE_ERRORS } from '../constants/error-messages';

function createSqliteModule(): DynamicModule {
  return {
    module: DatabaseModule,
    imports: [ConfigModule],
    providers: [sqliteProvider],
    exports: [SQLITE_DATABASE],
    global: true,
  };
}

function createSupabaseModule(): DynamicModule {
  return {
    module: DatabaseModule,
    imports: [ConfigModule],
    providers: [supabaseProvider],
    exports: [SUPABASE_CLIENT],
    global: true,
  };
}

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const dbType = process.env.DB_TYPE;

    if (!dbType) {
      throw new Error(DATABASE_ERRORS.MISSING_DB_TYPE);
    }

    if (dbType === 'sqlite') return createSqliteModule();
    if (dbType === 'supabase') return createSupabaseModule();

    throw new Error(DATABASE_ERRORS.UNSUPPORTED_DB_TYPE(dbType));
  }
}
