import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../repositories/user.repository';
import { Department } from '../score.constants';
import { UserEntity } from '../entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepo: Record<string, jest.Mock>;

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
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepo },
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
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('존재하지 않는 유저는 isAdmin true로 생성한다', async () => {
      mockUserRepo.findByDiscordId.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({ ...mockUser, isAdmin: true });

      const result = await service.adminLogin('user-1', '홍길동', 'mashup1234');

      expect(result).toBe(true);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 0,
        department: Department.Unknown,
        isAdmin: true,
      });
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
});
