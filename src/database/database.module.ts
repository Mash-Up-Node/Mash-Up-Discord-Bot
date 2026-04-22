import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StudySessionEntity } from '../modules/study/entities/study-session.entity';
import { UserEntity } from '../modules/user/entities/user.entity';
import { TeamEntity } from '../modules/user/entities/team.entity';
import { DATABASE_ERRORS } from '../constants/error-messages';

const entities = [StudySessionEntity, UserEntity, TeamEntity];

const dataSourceOptions: Record<
  string,
  (config: ConfigService) => TypeOrmModuleOptions
> = {
  sqlite: () => ({
    type: 'better-sqlite3',
    database: process.env.SQLITE_PATH ?? 'study.db',
    entities,
    synchronize: true,
  }),
  supabase: (config: ConfigService) => ({
    type: 'postgres',
    url: config.getOrThrow<string>('DATABASE_URL'),
    entities,
    synchronize: false,
  }),
};

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const dbType = process.env.DB_TYPE;

    if (!dbType) {
      throw new Error(DATABASE_ERRORS.MISSING_DB_TYPE);
    }

    if (!dataSourceOptions[dbType]) {
      throw new Error(DATABASE_ERRORS.UNSUPPORTED_DB_TYPE(dbType));
    }

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) =>
            dataSourceOptions[dbType](config),
        }),
      ],
      global: true,
    };
  }
}
