import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StudySessionEntity } from '../modules/study/entities/study-session.entity';
import { CategoryEntity } from '../modules/study/entities/category.entity';
import { UserEntity } from '../modules/user/entities/user.entity';
import { TeamEntity } from '../modules/user/entities/team.entity';
import { DiscordChannelEntity } from '../modules/shared/entities/discord-channel.entity';
import { TicketacoDeliveryEntity } from '../modules/ticketaco/entities/ticketaco-delivery.entity';
import { TicketacoEventEntity } from '../modules/ticketaco/entities/ticketaco-event.entity';
import { TicketacoOrganizationEntity } from '../modules/ticketaco/entities/ticketaco-organization.entity';
import { TicketacoSubscriptionEntity } from '../modules/ticketaco/entities/ticketaco-subscription.entity';
import { DATABASE_ERRORS } from '../constants/error-messages';

const entities = [
  DiscordChannelEntity,
  StudySessionEntity,
  CategoryEntity,
  UserEntity,
  TeamEntity,
  TicketacoDeliveryEntity,
  TicketacoEventEntity,
  TicketacoOrganizationEntity,
  TicketacoSubscriptionEntity,
];

const dataSourceOptions: Record<
  string,
  (config: ConfigService) => TypeOrmModuleOptions
> = {
  sqlite: () => ({
    type: 'better-sqlite3',
    database: process.env.SQLITE_PATH ?? 'study.db',
    entities,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  }),
  supabase: (config: ConfigService) => ({
    type: 'postgres',
    url: config.getOrThrow<string>('DATABASE_URL'),
    entities,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
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
