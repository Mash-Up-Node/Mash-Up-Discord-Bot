import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeamEntity } from './team.entity';
import { JobTag } from '../score.constants';

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ name: 'discord_id', type: 'varchar' })
  discordId!: string;

  @Column({ type: 'varchar' })
  nickname!: string;

  @Column({ type: 'integer' })
  generation!: number;

  @Column({ name: 'job_tag', type: 'varchar', default: JobTag.Unknown })
  jobTag!: JobTag;

  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin!: boolean;

  @Column({ name: 'team_id', type: 'integer', nullable: true })
  teamId!: number | null;

  @ManyToOne(() => TeamEntity, (team) => team.members)
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity | null;

  @Column({ type: 'integer', default: 0 })
  score!: number;
}
