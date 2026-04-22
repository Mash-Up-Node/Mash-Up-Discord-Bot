import { Module } from '@nestjs/common';
import { ScoreService } from './score.service';
import { ScoreCommands } from './score.commands';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [ScoreService, ScoreCommands],
  exports: [ScoreService],
})
export class ScoreModule {}
