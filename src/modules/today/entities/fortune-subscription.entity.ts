import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { FortuneGenderInput } from '../dto/today-fortune-query.dto';

@Entity('fortune_subscriptions')
export class FortuneSubscriptionEntity {
  @PrimaryColumn({ name: 'discord_id', type: 'varchar' })
  discordId!: string;

  @Column({ type: 'varchar' })
  gender!: FortuneGenderInput;

  @Column({ name: 'birth_date', type: 'varchar' })
  birthDate!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
