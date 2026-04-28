import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { CategoryEntity } from './category.entity';

@Entity('study_sessions')
export class StudySessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({ name: 'channel_id', type: 'varchar' })
  channelId!: string;

  @Column({ name: 'category_id', type: 'varchar' })
  categoryId!: string;

  @Column({ name: 'joined_at' })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: Date, nullable: true })
  leftAt!: Date | null;

  @Column({ type: 'integer', nullable: true })
  duration!: number | null; // 초 단위

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'discordId' })
  user!: UserEntity;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'categoryId' })
  category!: CategoryEntity;
}

export interface StudySession {
  id: string;
  userId: string;
  channelId: string;
  categoryId: string;
  joinedAt: Date;
  leftAt: Date | null;
  duration: number | null;
}

export interface LeaderboardEntry {
  userId: string;
  total: number;
}
