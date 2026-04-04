import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import {
  LeaderboardEntry,
  StudySession,
} from '../entities/study-session.entity';
import { StudySessionRepository } from '../interfaces/study-session.repository';

interface StudySessionRow {
  id: string;
  user_id: string;
  channel_id: string;
  joined_at: string;
  left_at: string | null;
  duration: number | null;
}

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

  private toEntity(row: StudySessionRow): StudySession {
    return {
      id: row.id,
      userId: row.user_id,
      channelId: row.channel_id,
      joinedAt: new Date(row.joined_at),
      leftAt: row.left_at ? new Date(row.left_at) : null,
      duration: row.duration,
    };
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
    const duration = Math.floor(
      (leftAt.getTime() - active.joinedAt.getTime()) / 1000,
    );

    this.db
      .prepare(
        'UPDATE study_sessions SET left_at = ?, duration = ? WHERE id = ?',
      )
      .run(leftAt.toISOString(), duration, active.id);

    return {
      ...active,
      leftAt,
      duration,
    };
  }

  getActiveSession(userId: string): Promise<StudySession | null> {
    const row = this.db
      .prepare(
        'SELECT * FROM study_sessions WHERE user_id = ? AND left_at IS NULL',
      )
      .get(userId) as StudySessionRow | undefined;

    return Promise.resolve(row ? this.toEntity(row) : null);
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

    return Promise.resolve(rows.map((row) => this.toEntity(row)));
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
