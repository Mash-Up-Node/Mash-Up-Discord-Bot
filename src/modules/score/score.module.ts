import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamEntity } from './entities/team.entity';
import { TeamRepository } from './repositories/team.repository';
import { ScoreService } from './score.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([TeamEntity]), UserModule],
  providers: [TeamRepository, ScoreService],
  exports: [ScoreService],
})
export class ScoreModule {}
