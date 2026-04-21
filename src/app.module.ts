import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import { PingModule } from './modules/ping/ping.module';
import { StudyModule } from './modules/study/study.module';
import { ScoreModule } from './modules/score/score.module';
import { HealthModule } from './modules/health/health.module';
import { KeepAliveModule } from './modules/keep-alive/keep-alive.module';
import { DatabaseModule } from './database/database.module';
import { TodayModule } from './modules/today/today.module';
import { SharedModule } from './modules/shared/shared.module';
import { TicketacoModule } from './modules/ticketaco/ticketaco.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule.forRoot(),
    NecordModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('DISCORD_TOKEN'),
        intents: [
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.GuildMessages,
          IntentsBitField.Flags.MessageContent,
          IntentsBitField.Flags.GuildVoiceStates,
        ],
      }),
    }),
    PingModule,
    SharedModule,
    StudyModule,
    ScoreModule,
    TodayModule,
    HealthModule,
    KeepAliveModule,
    TicketacoModule,
  ],
})
export class AppModule {}
