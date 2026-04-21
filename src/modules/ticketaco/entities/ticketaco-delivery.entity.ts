import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TicketacoEventEntity } from './ticketaco-event.entity';
import { TicketacoSubscriptionEntity } from './ticketaco-subscription.entity';

@Entity('ticketaco_deliveries')
@Index(['eventId', 'subscriptionId'], { unique: true })
export class TicketacoDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId!: string;

  @Column({ name: 'sent_at' })
  sentAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => TicketacoEventEntity, (event) => event.deliveries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event!: TicketacoEventEntity;

  @ManyToOne(
    () => TicketacoSubscriptionEntity,
    (subscription) => subscription.deliveries,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'subscription_id' })
  subscription!: TicketacoSubscriptionEntity;
}
