import { Module } from '@nestjs/common';
import Database from 'better-sqlite3';
import { STUDY_SESSION_REPOSITORY } from './interfaces/study-session.repository';
import { SqliteStudySessionRepository } from './repositories/sqlite-study-session.repository';
import { StudyService } from './study.service';
import { StudyListener } from './study.listener';
import { StudyCommands } from './study.commands';

@Module({
  providers: [
    {
      provide: STUDY_SESSION_REPOSITORY,
      useFactory: () => {
        const db = new Database('study.db');
        return new SqliteStudySessionRepository(db);
      },
    },
    StudyService,
    StudyListener,
    StudyCommands,
  ],
})
export class StudyModule {}
