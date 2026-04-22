import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { TeamEntity } from '../user/entities/team.entity';
import { TeamRanking } from './score.constants';
import { UserRepository } from '../user/repositories/user.repository';

@Injectable()
export class ScoreService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
  ) {}

  async addScore(discordId: string, amount: number): Promise<void> {
    await this.userRepository.addScore(discordId, amount);
  }

  async getMyScore(discordId: string): Promise<UserEntity | null> {
    return this.userRepository.findByDiscordId(discordId);
  }

  async getTeamRanking(): Promise<TeamRanking[]> {
    return this.userRepository.getTeamRanking();
  }

  async resetAll(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ score: 0, teamId: null })
        .execute();
      await manager.createQueryBuilder().delete().from(TeamEntity).execute();
    });
  }
}
