import { Inject, Injectable } from '@nestjs/common';
import {
  LeaderboardEntry,
  StudySession,
} from './entities/study-session.entity';
import {
  STUDY_SESSION_REPOSITORY,
  StudySessionRepository,
} from './interfaces/study-session.repository';

@Injectable()
export class StudyService {
  constructor(
    @Inject(STUDY_SESSION_REPOSITORY)
    private readonly repository: StudySessionRepository,
  ) {}

  async handleJoin(userId: string, channelId: string): Promise<StudySession> {
    const existing = await this.repository.getActiveSession(userId);
    if (existing) return existing;

    return this.repository.createSession(userId, channelId);
  }

  async handleLeave(userId: string): Promise<StudySession | null> {
    return this.repository.endSession(userId);
  }

  async handleMove(
    userId: string,
    newChannelId: string,
  ): Promise<StudySession> {
    await this.repository.endSession(userId);
    return this.repository.createSession(userId, newChannelId);
  }

  async getTotalDuration(userId: string): Promise<number> {
    return this.repository.getTotalDuration(userId);
  }

  async getActiveSessionsAll(): Promise<StudySession[]> {
    return this.repository.getActiveSessionsAll();
  }

  getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    return this.repository.getLeaderboard(limit);
  }
}
