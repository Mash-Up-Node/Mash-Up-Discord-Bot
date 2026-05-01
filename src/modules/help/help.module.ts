import { Module } from '@nestjs/common';
import { HelpCommands } from './help.commands';

@Module({
  providers: [HelpCommands],
})
export class HelpModule {}
