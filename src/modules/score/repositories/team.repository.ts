import { TeamEntity } from '../entities/team.entity';

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');

export interface TeamRepository {
  create(name: string): Promise<TeamEntity>;
  findById(id: number): Promise<TeamEntity | null>;
  findAllWithMembers(): Promise<TeamEntity[]>;
  deleteAll(): Promise<void>;
}
