import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INVALID_BIRTH_DATE } from '../constants/today.messages';
import { FortuneGenderInput } from '../dto/today-fortune-query.dto';
import { FortuneSubscriptionEntity } from '../entities/fortune-subscription.entity';

@Injectable()
export class FortuneSubscriptionService {
  constructor(
    @InjectRepository(FortuneSubscriptionEntity)
    private readonly repo: Repository<FortuneSubscriptionEntity>,
  ) {}

  async subscribe(
    discordId: string,
    gender: FortuneGenderInput,
    birthDate: string,
  ): Promise<FortuneSubscriptionEntity> {
    // 생년월일 형식은 발송 시점에도 다시 검증되지만, 잘못된 입력을 미리 거른다.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      throw new Error(INVALID_BIRTH_DATE);
    }

    const existing = await this.repo.findOne({ where: { discordId } });
    if (existing) {
      await this.repo.update({ discordId }, { gender, birthDate });
      return { ...existing, gender, birthDate };
    }
    return this.repo.save(this.repo.create({ discordId, gender, birthDate }));
  }

  async unsubscribe(discordId: string): Promise<boolean> {
    const result = await this.repo.delete({ discordId });
    return (result.affected ?? 0) > 0;
  }

  async findAll(): Promise<FortuneSubscriptionEntity[]> {
    return this.repo.find();
  }

  async findOne(discordId: string): Promise<FortuneSubscriptionEntity | null> {
    return this.repo.findOne({ where: { discordId } });
  }
}
