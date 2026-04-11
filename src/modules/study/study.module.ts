import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudySessionEntity } from './entities/study-session.entity';
import { STUDY_SESSION_REPOSITORY } from './repositories/study-session.repository';
import { StudySessionTypeormRepository } from './repositories/study-session.typeorm-repository';
import { StudyService } from './study.service';
import { StudyListener } from './study.listener';
import { StudyCommands } from './study.commands';

@Module({
  imports: [TypeOrmModule.forFeature([StudySessionEntity])],
  providers: [
    {
      provide: STUDY_SESSION_REPOSITORY,
      inject: [getRepositoryToken(StudySessionEntity)],
      useFactory: (repo: Repository<StudySessionEntity>) =>
        new StudySessionTypeormRepository(repo),
    },
    StudyService,
    StudyListener,
    StudyCommands,
  ],
})
export class StudyModule {}
