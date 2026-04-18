import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('discord_channels')
@Index(['channelId'], { unique: true })
export class DiscordChannelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'channel_id', type: 'varchar' })
  channelId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
