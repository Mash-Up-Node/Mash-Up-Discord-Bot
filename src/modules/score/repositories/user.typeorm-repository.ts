import { In, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from './user.repository';
import { Department, TeamRanking } from '../score.constants';

export class UserTypeormRepository implements UserRepository {
  constructor(private readonly repo: Repository<UserEntity>) {}

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
  }): Promise<UserEntity> {
    const user = this.repo.create({
      ...data,
      isAdmin: false,
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
      .select('t.id', 'teamId')
      .addSelect('t.name', 'teamName')
      .addSelect('COALESCE(SUM(u.score), 0)', 'totalScore')
      .groupBy('t.id')
      .addGroupBy('t.name')
      .orderBy('totalScore', 'DESC')
      .getRawMany<{ teamId: number; teamName: string; totalScore: string }>();

    return rows.map((row) => ({
      teamId: Number(row.teamId),
      teamName: row.teamName,
      totalScore: Number(row.totalScore),
    }));
  }

  async updateTeamId(
    discordIds: string[],
    teamId: number | null,
  ): Promise<void> {
    if (discordIds.length === 0) return;
    await this.repo.update({ discordId: In(discordIds) }, { teamId });
  }

  async resetAllScoresAndTeams(): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ score: 0, teamId: null })
      .execute();
  }
}
