import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { TeamEntity } from './entities/team.entity';
import { USER_REPOSITORY } from './repositories/user.repository';
import { UserTypeormRepository } from './repositories/user.typeorm-repository';
import { TEAM_REPOSITORY } from './repositories/team.repository';
import { TeamTypeormRepository } from './repositories/team.typeorm-repository';
import { ScoreService } from './score.service';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TeamEntity])],
  providers: [
    {
      provide: USER_REPOSITORY,
      inject: [getRepositoryToken(UserEntity)],
      useFactory: (repo: Repository<UserEntity>) =>
        new UserTypeormRepository(repo),
    },
    {
      provide: TEAM_REPOSITORY,
      inject: [getRepositoryToken(TeamEntity)],
      useFactory: (repo: Repository<TeamEntity>) =>
        new TeamTypeormRepository(repo),
    },
    ScoreService,
    UserService,
  ],
  exports: [ScoreService, UserService],
})
export class ScoreModule {}
