import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { Department } from '../user.constants';
import { TeamRanking } from '../../score/score.constants';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findByDiscordId(discordId: string): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { discordId },
      relations: ['team'],
    });
  }

  async create(data: {
    discordId: string;
    nickname: string;
    generation: number;
    department: Department;
    isAdmin?: boolean;
  }): Promise<UserEntity> {
    const user = this.repo.create({
      ...data,
      isAdmin: data.isAdmin ?? false,
      teamId: null,
      score: 0,
    });
    return this.repo.save(user);
  }

  async update(
    discordId: string,
    data: Partial<Omit<UserEntity, 'discordId' | 'team'>>,
  ): Promise<void> {
    await this.repo.update(discordId, data);
  }

  async addScore(discordId: string, amount: number): Promise<void> {
    await this.repo.increment({ discordId }, 'score', amount);
  }

  async getTeamRanking(): Promise<TeamRanking[]> {
    const rows = await this.repo
      .createQueryBuilder('u')
      .innerJoin('u.team', 't')
      .select('t.id', 'team_id')
      .addSelect('t.name', 'team_name')
      .addSelect('COALESCE(SUM(u.score), 0)', 'total_score')
      .groupBy('t.id')
      .addGroupBy('t.name')
      .orderBy('total_score', 'DESC')
      .getRawMany<{ team_id: number; team_name: string; total_score: string }>();

    return rows.map((row) => ({
      teamId: Number(row.team_id),
      teamName: row.team_name,
      totalScore: Number(row.total_score),
    }));
  }

  async updateTeamId(
    discordIds: string[],
    teamId: number | null,
  ): Promise<void> {
    if (discordIds.length === 0) return;
    await this.repo.update({ discordId: In(discordIds) }, { teamId });
  }
}
