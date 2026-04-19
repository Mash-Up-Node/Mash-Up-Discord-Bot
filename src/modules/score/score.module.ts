import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { TeamEntity } from './entities/team.entity';
import { UserRepository } from './repositories/user.repository';
import { TeamRepository } from './repositories/team.repository';
import { ScoreService } from './score.service';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TeamEntity])],
  providers: [UserRepository, TeamRepository, ScoreService, UserService],
  exports: [ScoreService, UserService],
})
export class ScoreModule {}
