import { Repository } from 'typeorm';
import { TeamEntity } from '../entities/team.entity';
import { TeamRepository } from './team.repository';

export class TeamTypeormRepository implements TeamRepository {
  constructor(private readonly repo: Repository<TeamEntity>) {}

  async create(name: string): Promise<TeamEntity> {
    const team = this.repo.create({ name });
    return this.repo.save(team);
  }

  async findById(id: number): Promise<TeamEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['members'],
    });
  }

  async findAllWithMembers(): Promise<TeamEntity[]> {
    return this.repo.find({
      relations: ['members'],
      order: { id: 'ASC' },
    });
  }

  async deleteAll(): Promise<void> {
    await this.repo.createQueryBuilder().delete().execute();
  }
}
