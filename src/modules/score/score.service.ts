import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { TeamEntity } from './entities/team.entity';
import {
  Department,
  DEPARTMENT_REGEX,
  ADMIN_PASSWORD,
  TeamRanking,
  SyncResult,
} from './score.constants';
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
  ) {}

  // --- Internal API (타 모듈 연동용) ---

  async addScore(discordId: string, amount: number): Promise<void> {
    await this.userRepository.addScore(discordId, amount);
  }

  // --- Queries ---

  async getMyScore(discordId: string): Promise<UserEntity | null> {
    return this.userRepository.findByDiscordId(discordId);
  }

  async getTeamRanking(): Promise<TeamRanking[]> {
    return this.userRepository.getTeamRanking();
  }

  async getTeamList(): Promise<TeamEntity[]> {
    return this.teamRepository.findAllWithMembers();
  }

  // --- Member Management ---

  async syncMembers(
    members: { discordId: string; displayName: string }[],
    generation: number,
  ): Promise<SyncResult> {
    const failed: SyncResult['failed'] = [];
    let synced = 0;

    for (const member of members) {
      const match = member.displayName.match(DEPARTMENT_REGEX);
      const department = match
        ? (match[1] as Department)
        : Department.Unknown;
      const nickname = member.displayName
        .replace(DEPARTMENT_REGEX, '')
        .trim();

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

  // --- Team Building ---

  async buildTeam(name: string, memberIds: string[]): Promise<TeamEntity> {
    const team = await this.teamRepository.create(name);
    await this.userRepository.updateTeamId(memberIds, team.id);
    return (await this.teamRepository.findById(team.id)) as TeamEntity;
  }

  // --- Admin ---

  async adminLogin(
    discordId: string,
    nickname: string,
    password: string,
  ): Promise<boolean> {
    if (password !== ADMIN_PASSWORD) return false;

    const user = await this.userRepository.findByDiscordId(discordId);
    if (!user) {
      await this.userRepository.create({
        discordId,
        nickname,
        generation: 0,
        department: Department.Unknown,
      });
    }

    await this.userRepository.update(discordId, { isAdmin: true });
    return true;
  }

  async isAdmin(discordId: string): Promise<boolean> {
    const user = await this.userRepository.findByDiscordId(discordId);
    return user?.isAdmin ?? false;
  }

  // --- Season Reset ---

  async resetAll(): Promise<void> {
    await this.userRepository.resetAllScoresAndTeams();
    await this.teamRepository.deleteAll();
  }
}
