import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudySessionEntity } from './entities/study-session.entity';
import { CategoryEntity } from './entities/category.entity';
import { STUDY_SESSION_REPOSITORY } from './repositories/study-session.repository';
import { StudySessionTypeormRepository } from './repositories/study-session.typeorm-repository';
import { CATEGORY_REPOSITORY } from './repositories/category.repository';
import { CategoryTypeormRepository } from './repositories/category.typeorm-repository';
import { StudyService } from './study.service';
import { StudyListener } from './study.listener';
import { StudyCommands } from './study.commands';
import { CategoryService } from './category.service';
import { CategoryCommands } from './category.commands';
import { ScoreModule } from '../score/score.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudySessionEntity, CategoryEntity]),
    ScoreModule,
    UserModule,
  ],
  providers: [
    {
      provide: STUDY_SESSION_REPOSITORY,
      inject: [getRepositoryToken(StudySessionEntity)],
      useFactory: (repo: Repository<StudySessionEntity>) =>
        new StudySessionTypeormRepository(repo),
    },
    {
      provide: CATEGORY_REPOSITORY,
      inject: [getRepositoryToken(CategoryEntity)],
      useFactory: (repo: Repository<CategoryEntity>) =>
        new CategoryTypeormRepository(repo),
    },
    StudyService,
    StudyListener,
    StudyCommands,
    CategoryService,
    CategoryCommands,
  ],
})
export class StudyModule {}
