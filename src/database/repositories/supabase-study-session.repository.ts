import { SupabaseClient } from '@supabase/supabase-js';
import {
  LeaderboardEntry,
  StudySession,
} from '../../modules/study/entities/study-session.entity';
import { StudySessionRepository } from '../../modules/study/interfaces/study-session.repository';

interface StudySessionRow {
  id: string;
  user_id: string;
  channel_id: string;
  joined_at: string;
  left_at: string | null;
  duration: number | null;
}

interface LeaderboardRow {
  user_id: string;
  total: number;
}

export class SupabaseStudySessionRepository implements StudySessionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

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

  async createSession(
    userId: string,
    channelId: string,
  ): Promise<StudySession> {
    const { data, error } = (await this.supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        channel_id: channelId,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()) as { data: StudySessionRow; error: Error | null };

    if (error) throw error;
    return this.toEntity(data);
  }

  async getActiveSession(userId: string): Promise<StudySession | null> {
    const { data, error } = (await this.supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('left_at', null)
      .maybeSingle()) as {
      data: StudySessionRow | null;
      error: Error | null;
    };

    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async endSession(userId: string): Promise<StudySession | null> {
    const active = await this.getActiveSession(userId);
    if (!active) return null;

    const leftAt = new Date();
    const duration = Math.floor(
      (leftAt.getTime() - active.joinedAt.getTime()) / 1000,
    );

    const { error } = await this.supabase
      .from('study_sessions')
      .update({ left_at: leftAt.toISOString(), duration })
      .eq('id', active.id);

    if (error) throw error;
    return { ...active, leftAt, duration };
  }

  async getTotalDuration(userId: string): Promise<number> {
    const { data, error } = (await this.supabase
      .from('study_sessions')
      .select('duration')
      .eq('user_id', userId)
      .not('duration', 'is', null)) as {
      data: { duration: number | null }[];
      error: Error | null;
    };

    if (error) throw error;
    return (data ?? []).reduce(
      (sum: number, row: { duration: number | null }) =>
        sum + (row.duration ?? 0),
      0,
    );
  }

  async getActiveSessionsAll(): Promise<StudySession[]> {
    const { data, error } = (await this.supabase
      .from('study_sessions')
      .select('*')
      .is('left_at', null)) as {
      data: StudySessionRow[];
      error: Error | null;
    };

    if (error) throw error;
    return (data ?? []).map((row) => this.toEntity(row));
  }

  async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const { data, error } = (await this.supabase.rpc('get_study_leaderboard', {
      row_limit: limit,
    })) as { data: LeaderboardRow[]; error: Error | null };

    if (error) throw error;
    return (data ?? []).map((row) => ({
      userId: row.user_id,
      total: row.total,
    }));
  }
}
