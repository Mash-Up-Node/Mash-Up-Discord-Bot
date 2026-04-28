import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ScoreService } from '../score.service';
import { UserRepository } from '../../user/repositories/user.repository';
import { Department } from '../../user/user.constants';
import { UserEntity } from '../../user/entities/user.entity';

describe('ScoreService', () => {
  let service: ScoreService;
  let mockUserRepo: Record<string, jest.Mock>;
  let mockDataSource: { transaction: jest.Mock };
  let mockManager: { createQueryBuilder: jest.Mock };

  const mockUser: UserEntity = {
    discordId: 'user-1',
    nickname: '홍길동',
    generation: 16,
    department: Department.Node,
    isAdmin: false,
    teamId: null,
    team: null,
    score: 0,
  };

  beforeEach(async () => {
    mockUserRepo = {
      findByDiscordId: jest.fn(),
      addScore: jest.fn(),
      getTeamRanking: jest.fn(),
    };

    const queryBuilderUpdate = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };
    const queryBuilderDelete = {
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    mockManager = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(queryBuilderUpdate)
        .mockReturnValueOnce(queryBuilderDelete),
    };

    mockDataSource = {
      transaction: jest.fn((cb: (m: typeof mockManager) => Promise<unknown>) =>
        cb(mockManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreService,
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ScoreService>(ScoreService);
  });

  describe('addScore', () => {
    it('유저의 점수를 증가시킨다', async () => {
      await service.addScore('user-1', 10);

      expect(mockUserRepo.addScore).toHaveBeenCalledWith('user-1', 10);
    });
  });

  describe('getMyScore', () => {
    it('유저 정보를 반환한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(mockUser);

      const result = await service.getMyScore('user-1');

      expect(mockUserRepo.findByDiscordId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('존재하지 않는 유저는 null을 반환한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);

      const result = await service.getMyScore('unknown');

      expect(result).toBeNull();
    });
  });

  describe('getTeamRanking', () => {
    it('팀별 합산 점수 랭킹을 반환한다', async () => {
      const ranking = [{ teamId: 1, teamName: '1조', totalScore: 100 }];
      mockUserRepo.getTeamRanking.mockResolvedValue(ranking);

      const result = await service.getTeamRanking();

      expect(result).toEqual(ranking);
    });
  });

  describe('resetAll', () => {
    it('트랜잭션 안에서 점수와 팀을 모두 초기화한다', async () => {
      await service.resetAll();

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });
});
