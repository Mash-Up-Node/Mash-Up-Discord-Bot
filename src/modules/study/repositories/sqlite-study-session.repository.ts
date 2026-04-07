import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import {
  LeaderboardEntry,
  StudySession,
} from '../entities/study-session.entity';
import { StudySessionRepository } from './study-session.repository';
import {
  StudySessionRow,
  toEntity,
  calculateDuration,
} from './study-session.mapper';

export class SqliteStudySessionRepository implements StudySessionRepository {
  constructor(private readonly db: Database.Database) {
    this.initTable();
  }

  private initTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        left_at TEXT,
        duration INTEGER
      )
    `);
  }

  createSession(userId: string, channelId: string): Promise<StudySession> {
    const id = randomUUID();
    const joinedAt = new Date().toISOString();

    this.db
      .prepare(
        'INSERT INTO study_sessions (id, user_id, channel_id, joined_at) VALUES (?, ?, ?, ?)',
      )
      .run(id, userId, channelId, joinedAt);

    return Promise.resolve({
      id,
      userId,
      channelId,
      joinedAt: new Date(joinedAt),
      leftAt: null,
      duration: null,
    });
  }

  async endSession(userId: string): Promise<StudySession | null> {
    const active = await this.getActiveSession(userId);
    if (!active) return null;

    const leftAt = new Date();
    const duration = calculateDuration(active.joinedAt, leftAt);

    this.db
      .prepare(
        'UPDATE study_sessions SET left_at = ?, duration = ? WHERE id = ?',
      )
      .run(leftAt.toISOString(), duration, active.id);

    return { ...active, leftAt, duration };
  }

  getActiveSession(userId: string): Promise<StudySession | null> {
    const row = this.db
      .prepare(
        'SELECT * FROM study_sessions WHERE user_id = ? AND left_at IS NULL',
      )
      .get(userId) as StudySessionRow | undefined;

    return Promise.resolve(row ? toEntity(row) : null);
  }

  getTotalDuration(userId: string): Promise<number> {
    const result = this.db
      .prepare(
        'SELECT COALESCE(SUM(duration), 0) as total FROM study_sessions WHERE user_id = ? AND duration IS NOT NULL',
      )
      .get(userId) as { total: number };

    return Promise.resolve(result.total);
  }

  getActiveSessionsAll(): Promise<StudySession[]> {
    const rows = this.db
      .prepare('SELECT * FROM study_sessions WHERE left_at IS NULL')
      .all() as StudySessionRow[];

    return Promise.resolve(rows.map((row) => toEntity(row)));
  }

  getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const rows = this.db
      .prepare(
        'SELECT user_id, COALESCE(SUM(duration), 0) as total FROM study_sessions WHERE duration IS NOT NULL GROUP BY user_id ORDER BY total DESC LIMIT ?',
      )
      .all(limit) as { user_id: string; total: number }[];

    return Promise.resolve(
      rows.map((row) => ({ userId: row.user_id, total: row.total })),
    );
  }
}
