import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { TeamEntity } from './entities/team.entity';
import { TeamRanking } from './score.constants';
import {
  USER_REPOSITORY,
  UserRepository,
} from './repositories/user.repository';
import {
  TEAM_REPOSITORY,
  TeamRepository,
} from './repositories/team.repository';

@Injectable()
export class ScoreService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: TeamRepository,
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

  async getTeamList(): Promise<TeamEntity[]> {
    return this.teamRepository.findAllWithMembers();
  }

  async buildTeam(name: string, memberIds: string[]): Promise<TeamEntity> {
    return this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(TeamEntity);
      const userRepo = manager.getRepository(UserEntity);

      const team = await teamRepo.save(teamRepo.create({ name }));
      if (memberIds.length > 0) {
        await userRepo.update(
          { discordId: In(memberIds) },
          { teamId: team.id },
        );
      }
      return (await teamRepo.findOne({
        where: { id: team.id },
        relations: ['members'],
      })) as TeamEntity;
    });
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
