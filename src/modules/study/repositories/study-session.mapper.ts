import { StudySession } from '../entities/study-session.entity';

export interface StudySessionRow {
  id: string;
  user_id: string;
  channel_id: string;
  joined_at: string;
  left_at: string | null;
  duration: number | null;
}

export interface LeaderboardRow {
  user_id: string;
  total: number;
}

export function toEntity(row: StudySessionRow): StudySession {
  return {
    id: row.id,
    userId: row.user_id,
    channelId: row.channel_id,
    joinedAt: new Date(row.joined_at),
    leftAt: row.left_at ? new Date(row.left_at) : null,
    duration: row.duration,
  };
}

export function calculateDuration(joinedAt: Date, leftAt: Date): number {
  return Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000);
}
