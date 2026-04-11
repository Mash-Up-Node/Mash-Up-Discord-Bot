import { Repository, IsNull } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  StudySessionEntity,
  StudySession,
  LeaderboardEntry,
} from '../entities/study-session.entity';
import { StudySessionRepository } from './study-session.repository';

export class StudySessionTypeormRepository implements StudySessionRepository {
  constructor(private readonly repo: Repository<StudySessionEntity>) {}

  async createSession(
    userId: string,
    channelId: string,
  ): Promise<StudySession> {
    const session = this.repo.create({
      id: randomUUID(),
      userId,
      channelId,
      joinedAt: new Date(),
      leftAt: null,
      duration: null,
    });

    return this.repo.save(session);
  }

  async getActiveSession(userId: string): Promise<StudySession | null> {
    return this.repo.findOne({
      where: { userId, leftAt: IsNull() },
    });
  }

  async endSession(userId: string): Promise<StudySession | null> {
    const active = await this.getActiveSession(userId);
    if (!active) return null;

    const leftAt = new Date();
    const duration = Math.floor(
      (leftAt.getTime() - active.joinedAt.getTime()) / 1000,
    );

    await this.repo.update(active.id, { leftAt, duration });

    return { ...active, leftAt, duration };
  }

  async getTotalDuration(userId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.duration), 0)', 'total')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.duration IS NOT NULL')
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  async getActiveSessionsAll(): Promise<StudySession[]> {
    return this.repo.find({
      where: { leftAt: IsNull() },
    });
  }

  async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const rows = await this.repo
      .createQueryBuilder('s')
      .select('s.user_id', 'userId')
      .addSelect('COALESCE(SUM(s.duration), 0)', 'total')
      .where('s.duration IS NOT NULL')
      .groupBy('s.user_id')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany<{ userId: string; total: string }>();

    return rows.map((row) => ({
      userId: row.userId,
      total: Number(row.total),
    }));
  }
}
