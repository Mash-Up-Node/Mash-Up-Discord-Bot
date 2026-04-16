import { Test, TestingModule } from '@nestjs/testing';
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
      addScore: jest.fn(),
      getTeamRanking: jest.fn(),
      updateTeamId: jest.fn(),
      resetAllScoresAndTeams: jest.fn(),
    };

    mockTeamRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAllWithMembers: jest.fn(),
      deleteAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreService,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
        { provide: TEAM_REPOSITORY, useValue: mockTeamRepo },
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

      const members = [
        { discordId: 'user-1', displayName: '[스프링]홍길동' },
      ];

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

      const members = [
        { discordId: 'user-1', displayName: '태그없는사람' },
      ];

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
      const updatedUser = { ...mockUser, department: Department.Spring };
      mockUserRepo.findByDiscordId
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);

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

  describe('buildTeam', () => {
    it('팀을 생성하고 멤버를 배정한다', async () => {
      const teamWithMembers = { ...mockTeam, members: [mockUser] };
      mockTeamRepo.create.mockResolvedValue(mockTeam);
      mockTeamRepo.findById.mockResolvedValue(teamWithMembers);

      const result = await service.buildTeam('1조', ['user-1']);

      expect(mockTeamRepo.create).toHaveBeenCalledWith('1조');
      expect(mockUserRepo.updateTeamId).toHaveBeenCalledWith(['user-1'], 1);
      expect(result.members).toHaveLength(1);
    });
  });

  describe('adminLogin', () => {
    it('올바른 비밀번호로 로그인하면 관리자 권한을 부여한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(mockUser);

      const result = await service.adminLogin('user-1', '홍길동', 'mashup1234');

      expect(result).toBe(true);
      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        isAdmin: true,
      });
    });

    it('잘못된 비밀번호로 로그인하면 실패한다', async () => {
      const result = await service.adminLogin('user-1', '홍길동', 'wrong');

      expect(result).toBe(false);
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });

    it('존재하지 않는 유저도 올바른 비밀번호로 로그인하면 자동 생성한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const result = await service.adminLogin('user-1', '홍길동', 'mashup1234');

      expect(result).toBe(true);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 0,
        department: Department.Unknown,
      });
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

  describe('resetAll', () => {
    it('점수와 팀을 모두 초기화한다', async () => {
      await service.resetAll();

      expect(mockUserRepo.resetAllScoresAndTeams).toHaveBeenCalled();
      expect(mockTeamRepo.deleteAll).toHaveBeenCalled();
    });
  });
});
