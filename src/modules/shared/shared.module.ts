import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordChannelEntity } from './entities/discord-channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiscordChannelEntity])],
  exports: [TypeOrmModule],
})
export class SharedModule {}
