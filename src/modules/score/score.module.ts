import { Module } from '@nestjs/common';
import { ScoreService } from './score.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [ScoreService],
  exports: [ScoreService],
})
export class ScoreModule {}
