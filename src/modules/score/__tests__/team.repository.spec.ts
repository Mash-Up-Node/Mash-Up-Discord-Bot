import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { TeamEntity } from '../entities/team.entity';
import { TeamRepository } from '../repositories/team.repository';
import { Department } from '../score.constants';

describe('TeamRepository', () => {
  let dataSource: DataSource;
  let repo: TeamRepository;
  let userRepo: Repository<UserEntity>;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [UserEntity, TeamEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    repo = new TeamRepository(dataSource.getRepository(TeamEntity));
    userRepo = dataSource.getRepository(UserEntity);
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  describe('create', () => {
    it('팀을 생성한다', async () => {
      const team = await repo.create('1조');

      expect(team.id).toBeDefined();
      expect(team.name).toBe('1조');
    });
  });

  describe('findById', () => {
    it('존재하지 않는 팀은 null을 반환한다', async () => {
      const team = await repo.findById(999);
      expect(team).toBeNull();
    });

    it('팀을 멤버와 함께 반환한다', async () => {
      const team = await repo.create('1조');
      await userRepo.save(
        userRepo.create({
          discordId: 'user-1',
          nickname: '홍길동',
          generation: 16,
          department: Department.Node,
          isAdmin: false,
          teamId: team.id,
          score: 0,
        }),
      );

      const found = await repo.findById(team.id);

      expect(found).not.toBeNull();
      expect(found!.members).toHaveLength(1);
      expect(found!.members[0].nickname).toBe('홍길동');
    });
  });

  describe('findAllWithMembers', () => {
    it('팀이 없으면 빈 배열을 반환한다', async () => {
      const teams = await repo.findAllWithMembers();
      expect(teams).toEqual([]);
    });

    it('모든 팀을 멤버와 함께 id 오름차순으로 반환한다', async () => {
      const team1 = await repo.create('1조');
      const team2 = await repo.create('2조');
      await userRepo.save(
        userRepo.create({
          discordId: 'user-1',
          nickname: 'A',
          generation: 16,
          department: Department.Node,
          isAdmin: false,
          teamId: team1.id,
          score: 10,
        }),
      );
      await userRepo.save(
        userRepo.create({
          discordId: 'user-2',
          nickname: 'B',
          generation: 16,
          department: Department.Spring,
          isAdmin: false,
          teamId: team2.id,
          score: 20,
        }),
      );

      const teams = await repo.findAllWithMembers();

      expect(teams).toHaveLength(2);
      expect(teams[0].name).toBe('1조');
      expect(teams[0].members).toHaveLength(1);
      expect(teams[1].name).toBe('2조');
      expect(teams[1].members).toHaveLength(1);
    });
  });
});
