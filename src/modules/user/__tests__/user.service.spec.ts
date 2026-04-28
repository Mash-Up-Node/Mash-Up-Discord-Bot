import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserService } from '../user.service';
import { UserRepository } from '../repositories/user.repository';
import { TeamRepository } from '../repositories/team.repository';
import { Department } from '../user.constants';
import { UserEntity } from '../entities/user.entity';
import { TeamEntity } from '../entities/team.entity';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepo: Record<string, jest.Mock>;
  let mockTeamRepo: Record<string, jest.Mock>;
  let mockDataSource: { transaction: jest.Mock };
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
      create: jest.fn(),
      update: jest.fn(),
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
    mockDataSource = {
      transaction: jest.fn(
        (cb: (m: { getRepository: jest.Mock }) => Promise<unknown>) =>
          cb({
            getRepository: jest.fn((entity) => {
              if (entity === TeamEntity) return mockTeamRepoTx;
              if (entity === UserEntity) return mockUserRepoTx;
              return null;
            }),
          }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: TeamRepository, useValue: mockTeamRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('findByDiscordId', () => {
    it('유저를 반환한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(mockUser);

      const result = await service.findByDiscordId('user-1');

      expect(result).toEqual(mockUser);
    });
  });

  describe('syncMembers', () => {
    it('새 멤버를 생성하고 department를 파싱한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const members = [
        { discordId: 'user-1', displayName: '[노드]홍길동' },
        { discordId: 'user-2', displayName: '[디자인]김철수' },
      ];

      const result = await service.syncMembers(members, 16);

      expect(result.synced).toBe(2);
      expect(result.failed).toHaveLength(0);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 16,
        department: Department.Node,
      });
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        discordId: 'user-2',
        nickname: '김철수',
        generation: 16,
        department: Department.Design,
      });
    });

    it('기존 멤버는 update를 호출한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(mockUser);

      const members = [{ discordId: 'user-1', displayName: '[스프링]홍길동' }];

      const result = await service.syncMembers(members, 17);

      expect(result.synced).toBe(1);
      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        nickname: '홍길동',
        generation: 17,
        department: Department.Spring,
      });
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('파싱 실패 시 Unknown으로 처리하고 실패 리스트에 추가한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const members = [{ discordId: 'user-1', displayName: '태그없는사람' }];

      const result = await service.syncMembers(members, 16);

      expect(result.synced).toBe(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toEqual({
        discordId: 'user-1',
        displayName: '태그없는사람',
      });
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        discordId: 'user-1',
        nickname: '태그없는사람',
        generation: 16,
        department: Department.Unknown,
      });
    });

    it('모든 직무 태그를 올바르게 파싱한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const members = [
        { discordId: '1', displayName: '[노드]A' },
        { discordId: '2', displayName: '[스프링]B' },
        { discordId: '3', displayName: '[디자인]C' },
        { discordId: '4', displayName: '[아오스]D' },
        { discordId: '5', displayName: '[안드]E' },
        { discordId: '6', displayName: '[웹]F' },
      ];

      await service.syncMembers(members, 16);

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ department: Department.Node }),
      );
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ department: Department.Spring }),
      );
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ department: Department.Design }),
      );
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ department: Department.iOS }),
      );
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ department: Department.Android }),
      );
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ department: Department.Web }),
      );
    });
  });

  describe('registerMember', () => {
    it('새 멤버를 등록한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const result = await service.registerMember(
        'user-1',
        '홍길동',
        Department.Node,
        16,
      );

      expect(mockUserRepo.create).toHaveBeenCalledWith({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 16,
        department: Department.Node,
      });
      expect(result).toEqual(mockUser);
    });

    it('기존 멤버를 수정한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(mockUser);

      const result = await service.registerMember(
        'user-1',
        '홍길동',
        Department.Spring,
        17,
      );

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        nickname: '홍길동',
        department: Department.Spring,
        generation: 17,
      });
      expect(mockUserRepo.create).not.toHaveBeenCalled();
      expect(result.department).toBe(Department.Spring);
    });
  });

  describe('setAdmin', () => {
    it('isAdmin=true로 승격한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(mockUser);

      const result = await service.setAdmin('user-1', true);

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        isAdmin: true,
      });
      expect(result.isAdmin).toBe(true);
    });

    it('isAdmin=false로 권한을 해제한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue({
        ...mockUser,
        isAdmin: true,
      });

      const result = await service.setAdmin('user-1', false);

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        isAdmin: false,
      });
      expect(result.isAdmin).toBe(false);
    });

    it('존재하지 않는 유저는 에러를 던진다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);

      await expect(service.setAdmin('unknown', true)).rejects.toThrow(
        'User not found',
      );
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('관리자이면 true를 반환한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue({
        ...mockUser,
        isAdmin: true,
      });

      expect(await service.isAdmin('user-1')).toBe(true);
    });

    it('일반 유저이면 false를 반환한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(mockUser);

      expect(await service.isAdmin('user-1')).toBe(false);
    });

    it('존재하지 않는 유저이면 false를 반환한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);

      expect(await service.isAdmin('unknown')).toBe(false);
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
});
