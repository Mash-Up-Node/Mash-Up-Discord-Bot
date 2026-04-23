import {
  LeaderboardEntry,
  StudySession,
} from '../entities/study-session.entity';

export const STUDY_SESSION_REPOSITORY = Symbol('STUDY_SESSION_REPOSITORY');

export interface StudySessionRepository {
  createSession(
    userId: string,
    channelId: string,
    categoryId: string,
  ): Promise<StudySession>;
  endSession(userId: string): Promise<StudySession | null>;
  getActiveSession(userId: string): Promise<StudySession | null>;
  getTotalDuration(userId: string, categoryId?: string): Promise<number>;
  getActiveSessionsAll(): Promise<StudySession[]>;
  getLeaderboard(
    limit: number,
    categoryId?: string,
  ): Promise<LeaderboardEntry[]>;
}
