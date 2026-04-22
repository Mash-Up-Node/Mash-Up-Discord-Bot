import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { TeamEntity } from './entities/team.entity';
import { UserRepository } from './repositories/user.repository';
import { TeamRepository } from './repositories/team.repository';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TeamEntity])],
  providers: [UserRepository, TeamRepository, UserService],
  exports: [UserRepository, TeamRepository, UserService],
})
export class UserModule {}
