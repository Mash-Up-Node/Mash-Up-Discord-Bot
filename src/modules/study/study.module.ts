import { Module } from '@nestjs/common';
import { StudyService } from './study.service';
import { StudyListener } from './study.listener';
import { StudyCommands } from './study.commands';

@Module({
  providers: [StudyService, StudyListener, StudyCommands],
})
export class StudyModule {}
