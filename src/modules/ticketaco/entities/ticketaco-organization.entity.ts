import {
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { TicketacoSubscriptionEntity } from './ticketaco-subscription.entity';
import { TicketacoEventEntity } from './ticketaco-event.entity';

@Entity('ticketaco_organizations')
@Index(['slug'], { unique: true })
export class TicketacoOrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(
    () => TicketacoSubscriptionEntity,
    (subscription) => subscription.organization,
  )
  subscriptions!: TicketacoSubscriptionEntity[];

  @OneToMany(() => TicketacoEventEntity, (event) => event.organization)
  events!: TicketacoEventEntity[];
}
