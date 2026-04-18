import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import {
  Department,
  DEPARTMENT_REGEX,
  ADMIN_PASSWORD,
  SyncResult,
} from './score.constants';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

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

  async adminLogin(
    discordId: string,
    nickname: string,
    password: string,
  ): Promise<boolean> {
    if (password !== ADMIN_PASSWORD) return false;

    const user = await this.userRepository.findByDiscordId(discordId);
    if (user) {
      await this.userRepository.update(discordId, { isAdmin: true });
    } else {
      await this.userRepository.create({
        discordId,
        nickname,
        generation: 0,
        department: Department.Unknown,
        isAdmin: true,
      });
    }
    return true;
  }

  async isAdmin(discordId: string): Promise<boolean> {
    const user = await this.userRepository.findByDiscordId(discordId);
    return user?.isAdmin ?? false;
  }
}
