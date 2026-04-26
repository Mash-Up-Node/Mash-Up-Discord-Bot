import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DayOfWeek, ReservationKind } from '../constants/reservation.constants';

@Entity('channel_reservations')
@Index(['channelId', 'nextScheduledAt'])
@Index(['nextScheduledAt'])
export class ChannelReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'channel_id', type: 'varchar' })
  channelId!: string;

  @Column({ name: 'creator_user_id', type: 'varchar' })
  creatorUserId!: string;

  @Column({ type: 'varchar' })
  kind!: ReservationKind;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ name: 'reminder_message', type: 'varchar', nullable: true })
  reminderMessage!: string | null;

  // nextScheduledAt 기준 몇 분 전에 알림을 보낼지
  @Column({ name: 'reminder_offset_minutes', type: 'integer', default: 10 })
  reminderOffsetMinutes!: number;

  // weekly 예약은 월 ~ 일, once 예약은 null
  @Column({ name: 'day_of_week', type: 'integer', nullable: true })
  dayOfWeek!: DayOfWeek | null;

  // weekly 예약의 반복 시각(HH:mm), once 예약은 null
  @Column({ name: 'time_of_day', type: 'varchar', nullable: true })
  timeOfDay!: string | null;

  // 스케줄러가 다음으로 처리할 예약 시작 시각
  @Column({ name: 'next_scheduled_at', type: Date })
  nextScheduledAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
