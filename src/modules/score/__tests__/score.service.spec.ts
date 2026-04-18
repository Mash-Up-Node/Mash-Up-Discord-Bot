import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ScoreService } from '../score.service';
import { USER_REPOSITORY } from '../repositories/user.repository';
import { TEAM_REPOSITORY } from '../repositories/team.repository';
import { Department } from '../score.constants';
import { UserEntity } from '../entities/user.entity';
import { TeamEntity } from '../entities/team.entity';

describe('ScoreService', () => {
  let service: ScoreService;
  let mockUserRepo: Record<string, jest.Mock>;
  let mockTeamRepo: Record<string, jest.Mock>;
  let mockDataSource: { transaction: jest.Mock };
  let mockManager: {
    getRepository: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockTeamRepoTx: Record<string, jest.Mock>;
  let mockUserRepoTx: Record<string, jest.Mock>;

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

  const mockTeam: TeamEntity = {
    id: 1,
    name: '1조',
    members: [],
  };

  beforeEach(async () => {
    mockUserRepo = {
      findByDiscordId: jest.fn(),
      addScore: jest.fn(),
      getTeamRanking: jest.fn(),
    };

    mockTeamRepo = {
      findAllWithMembers: jest.fn(),
    };

    mockTeamRepoTx = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    mockUserRepoTx = {
      update: jest.fn(),
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
      getRepository: jest.fn((entity) => {
        if (entity === TeamEntity) return mockTeamRepoTx;
        if (entity === UserEntity) return mockUserRepoTx;
        return null;
      }),
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
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
        { provide: TEAM_REPOSITORY, useValue: mockTeamRepo },
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

  describe('getTeamList', () => {
    it('팀 목록을 멤버와 함께 반환한다', async () => {
      mockTeamRepo.findAllWithMembers.mockResolvedValue([mockTeam]);

      const result = await service.getTeamList();

      expect(result).toEqual([mockTeam]);
    });
  });

  describe('buildTeam', () => {
    it('트랜잭션 안에서 팀을 생성하고 멤버를 배정한다', async () => {
      const teamWithMembers = { ...mockTeam, members: [mockUser] };
      mockTeamRepoTx.save.mockResolvedValue(mockTeam);
      mockTeamRepoTx.findOne.mockResolvedValue(teamWithMembers);

      const result = await service.buildTeam('1조', ['user-1']);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockTeamRepoTx.save).toHaveBeenCalledWith({ name: '1조' });
      expect(mockUserRepoTx.update).toHaveBeenCalledWith(
        expect.objectContaining({ discordId: expect.anything() }),
        { teamId: 1 },
      );
      expect(result.members).toHaveLength(1);
    });

    it('멤버가 없으면 user 업데이트를 호출하지 않는다', async () => {
      mockTeamRepoTx.save.mockResolvedValue(mockTeam);
      mockTeamRepoTx.findOne.mockResolvedValue(mockTeam);

      await service.buildTeam('1조', []);

      expect(mockUserRepoTx.update).not.toHaveBeenCalled();
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
