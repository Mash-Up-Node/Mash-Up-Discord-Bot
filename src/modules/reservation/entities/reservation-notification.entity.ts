import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelReservationEntity } from './channel-reservation.entity';

@Entity('reservation_notifications')
@Index(['reservationId', 'scheduledAt'], { unique: true })
export class ReservationNotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'reservation_id', type: 'uuid' })
  reservationId!: string;

  @Column({ name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({ name: 'sent_at' })
  sentAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => ChannelReservationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reservation_id' })
  reservation!: ChannelReservationEntity;
}
