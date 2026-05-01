import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LeaderboardEntry,
  StudySession,
} from './entities/study-session.entity';
import {
  STUDY_SESSION_REPOSITORY,
  StudySessionRepository,
} from './repositories/study-session.repository';
import { ScoreService } from '../score/score.service';
import { SCORE_PER_MINUTE, SECONDS_PER_MINUTE } from './study.constants';

@Injectable()
export class StudyService {
  private readonly logger = new Logger(StudyService.name);

  constructor(
    @Inject(STUDY_SESSION_REPOSITORY)
    private readonly repository: StudySessionRepository,
    private readonly scoreService: ScoreService,
  ) {}

  async handleJoin(
    userId: string,
    channelId: string,
    categoryId: string,
  ): Promise<StudySession> {
    const existing = await this.repository.getActiveSession(userId);
    if (existing) return existing;

    return this.repository.createSession(userId, channelId, categoryId);
  }

  async handleLeave(userId: string): Promise<StudySession | null> {
    const ended = await this.repository.endSession(userId);
    await this.awardScoreFromSession(ended);
    return ended;
  }

  async handleMove(
    userId: string,
    newChannelId: string,
    newCategoryId: string,
  ): Promise<StudySession> {
    const ended = await this.repository.endSession(userId);
    await this.awardScoreFromSession(ended);
    return this.repository.createSession(userId, newChannelId, newCategoryId);
  }

  async getTotalDuration(userId: string, categoryId?: string): Promise<number> {
    return this.repository.getTotalDuration(userId, categoryId);
  }

  async getActiveSessionsAll(): Promise<StudySession[]> {
    return this.repository.getActiveSessionsAll();
  }

  getLeaderboard(
    limit: number,
    categoryId?: string,
  ): Promise<LeaderboardEntry[]> {
    return this.repository.getLeaderboard(limit, categoryId);
  }

  private async awardScoreFromSession(
    session: StudySession | null,
  ): Promise<void> {
    if (!session?.duration) return;

    const minutes = Math.floor(session.duration / SECONDS_PER_MINUTE);
    const points = minutes * SCORE_PER_MINUTE;
    if (points <= 0) return;

    try {
      await this.scoreService.addScore(session.userId, points);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to award score: userId=${session.userId}, points=${points}, error=${message}`,
      );
    }
  }
}
