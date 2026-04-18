import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TicketacoOrganizationEntity } from './ticketaco-organization.entity';
import { DiscordChannelEntity } from '../../shared/entities/discord-channel.entity';
import { TicketacoDeliveryEntity } from './ticketaco-delivery.entity';

@Entity('ticketaco_subscriptions')
@Index(['organizationId', 'channelId'], { unique: true })
export class TicketacoSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'channel_id', type: 'uuid' })
  channelId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(
    () => TicketacoOrganizationEntity,
    (organization) => organization.subscriptions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'organization_id' })
  organization!: TicketacoOrganizationEntity;

  @ManyToOne(() => DiscordChannelEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channel_id' })
  channel!: DiscordChannelEntity;

  @OneToMany(() => TicketacoDeliveryEntity, (delivery) => delivery.subscription)
  deliveries!: TicketacoDeliveryEntity[];
}
