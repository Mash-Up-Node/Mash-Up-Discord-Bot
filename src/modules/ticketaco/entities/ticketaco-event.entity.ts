import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketacoOrganizationEntity } from './ticketaco-organization.entity';
import { TicketacoDeliveryEntity } from './ticketaco-delivery.entity';

@Entity('ticketaco_events')
@Index(['organizationId', 'externalEventId'], { unique: true })
export class TicketacoEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'external_event_id', type: 'varchar' })
  externalEventId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ name: 'start_at' })
  startAt!: Date;

  @Column({ name: 'end_at' })
  endAt!: Date;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  venue!: string | null;

  @Column({ name: 'source_created_at' })
  sourceCreatedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(
    () => TicketacoOrganizationEntity,
    (organization) => organization.events,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'organization_id' })
  organization!: TicketacoOrganizationEntity;

  @OneToMany(() => TicketacoDeliveryEntity, (delivery) => delivery.event)
  deliveries!: TicketacoDeliveryEntity[];
}
