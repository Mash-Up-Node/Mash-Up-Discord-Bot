import { Repository } from 'typeorm';
import { INVALID_BIRTH_DATE } from '../constants/today.messages';
import { FortuneSubscriptionEntity } from '../entities/fortune-subscription.entity';
import { FortuneSubscriptionService } from '../services/fortune-subscription.service';

describe('FortuneSubscriptionService', () => {
  let service: FortuneSubscriptionService;
  let repo: Record<string, jest.Mock>;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new FortuneSubscriptionService(
      repo as unknown as Repository<FortuneSubscriptionEntity>,
    );
  });

  it('새 구독자는 row를 생성한다', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((data) => data);
    repo.save.mockImplementation(async (data) => data);

    const result = await service.subscribe('123', 'male', '1995-05-18');

    expect(repo.create).toHaveBeenCalledWith({
      discordId: '123',
      gender: 'male',
      birthDate: '1995-05-18',
    });
    expect(repo.save).toHaveBeenCalled();
    expect(result.discordId).toBe('123');
  });

  it('기존 구독자는 업데이트한다', async () => {
    const existing = {
      discordId: '123',
      gender: 'male',
      birthDate: '1995-05-18',
      createdAt: new Date('2026-01-01'),
    };
    repo.findOne.mockResolvedValue(existing);

    const result = await service.subscribe('123', 'female', '1990-01-01');

    expect(repo.update).toHaveBeenCalledWith(
      { discordId: '123' },
      { gender: 'female', birthDate: '1990-01-01' },
    );
    expect(repo.save).not.toHaveBeenCalled();
    expect(result.gender).toBe('female');
    expect(result.birthDate).toBe('1990-01-01');
  });

  it('생년월일 형식이 잘못되면 거부한다', async () => {
    await expect(
      service.subscribe('123', 'male', '1995/05/18'),
    ).rejects.toThrow(INVALID_BIRTH_DATE);
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('구독 해제 시 row가 있으면 true', async () => {
    repo.delete.mockResolvedValue({ affected: 1 });
    await expect(service.unsubscribe('123')).resolves.toBe(true);
  });

  it('구독 해제 시 row가 없으면 false', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.unsubscribe('123')).resolves.toBe(false);
  });
});
