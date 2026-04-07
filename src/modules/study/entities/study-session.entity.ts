import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('study_sessions')
export class StudySessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({ name: 'channel_id', type: 'varchar' })
  channelId!: string;

  @Column({ name: 'joined_at', type: 'datetime' })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'datetime', nullable: true })
  leftAt!: Date | null;

  @Column({ type: 'integer', nullable: true })
  duration!: number | null; // 초 단위
}

export interface StudySession {
  id: string;
  userId: string;
  channelId: string;
  joinedAt: Date;
  leftAt: Date | null;
  duration: number | null;
}

export interface LeaderboardEntry {
  userId: string;
  total: number;
}
