import { Module } from '@nestjs/common';
import { PingCommands } from './ping.commands';

@Module({
  providers: [PingCommands],
})
export class PingModule {}
