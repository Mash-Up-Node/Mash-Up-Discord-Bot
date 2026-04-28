import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { TeamEntity } from './entities/team.entity';
import { Department, DEPARTMENT_REGEX, SyncResult } from './user.constants';
import { UserRepository } from './repositories/user.repository';
import { TeamRepository } from './repositories/team.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly teamRepository: TeamRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findByDiscordId(discordId: string): Promise<UserEntity | null> {
    return this.userRepository.findByDiscordId(discordId);
  }

  async syncMembers(
    members: { discordId: string; displayName: string }[],
    generation: number,
  ): Promise<SyncResult> {
    const failed: SyncResult['failed'] = [];
    let synced = 0;

    for (const member of members) {
      const match = member.displayName.match(DEPARTMENT_REGEX);
      const department = match ? (match[1] as Department) : Department.Unknown;
      const nickname = member.displayName.replace(DEPARTMENT_REGEX, '').trim();

      if (!match) {
        failed.push({
          discordId: member.discordId,
          displayName: member.displayName,
        });
      }

      const existing = await this.userRepository.findByDiscordId(
        member.discordId,
      );
      if (existing) {
        await this.userRepository.update(member.discordId, {
          nickname: nickname || member.displayName,
          generation,
          department,
        });
      } else {
        await this.userRepository.create({
          discordId: member.discordId,
          nickname: nickname || member.displayName,
          generation,
          department,
        });
      }
      synced++;
    }

    return { synced, failed };
  }

  async registerMember(
    discordId: string,
    nickname: string,
    department: Department,
    generation: number,
  ): Promise<UserEntity> {
    const existing = await this.userRepository.findByDiscordId(discordId);
    if (existing) {
      await this.userRepository.update(discordId, {
        nickname,
        department,
        generation,
      });
      return { ...existing, nickname, department, generation };
    }
    return this.userRepository.create({
      discordId,
      nickname,
      generation,
      department,
    });
  }

  async setAdmin(discordId: string, isAdmin: boolean): Promise<UserEntity> {
    const user = await this.userRepository.findByDiscordId(discordId);
    if (!user) {
      throw new Error(`User not found: ${discordId}`);
    }
    await this.userRepository.update(discordId, { isAdmin });
    return { ...user, isAdmin };
  }

  async isAdmin(discordId: string): Promise<boolean> {
    const user = await this.userRepository.findByDiscordId(discordId);
    return user?.isAdmin ?? false;
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
}
