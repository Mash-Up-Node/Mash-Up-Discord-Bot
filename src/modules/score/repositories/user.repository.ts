import { UserEntity } from '../entities/user.entity';
import { JobTag, TeamRanking } from '../score.constants';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByDiscordId(discordId: string): Promise<UserEntity | null>;
  upsert(data: {
    discordId: string;
    nickname: string;
    generation: number;
    jobTag: JobTag;
  }): Promise<UserEntity>;
  update(
    discordId: string,
    data: Partial<Omit<UserEntity, 'discordId' | 'team'>>,
  ): Promise<void>;
  addScore(discordId: string, amount: number): Promise<void>;
  getTeamRanking(): Promise<TeamRanking[]>;
  updateTeamId(discordIds: string[], teamId: number | null): Promise<void>;
  resetAllScoresAndTeams(): Promise<void>;
}
