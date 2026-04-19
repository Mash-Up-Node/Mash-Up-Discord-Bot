import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { TeamEntity } from '../../score/entities/team.entity';
import { UserRepository } from '../repositories/user.repository';
import { Department } from '../user.constants';

describe('UserRepository', () => {
  let dataSource: DataSource;
  let repo: UserRepository;
  let teamRepo: Repository<TeamEntity>;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [UserEntity, TeamEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    teamRepo = dataSource.getRepository(TeamEntity);
    repo = new UserRepository(dataSource.getRepository(UserEntity));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  describe('create', () => {
    it('새 유저를 생성한다', async () => {
      const user = await repo.create({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 16,
        department: Department.Node,
      });

      expect(user.discordId).toBe('user-1');
      expect(user.nickname).toBe('홍길동');
      expect(user.score).toBe(0);
      expect(user.isAdmin).toBe(false);
      expect(user.teamId).toBeNull();
    });

    it('isAdmin true로 생성할 수 있다', async () => {
      const user = await repo.create({
        discordId: 'user-1',
        nickname: '관리자',
        generation: 0,
        department: Department.Unknown,
        isAdmin: true,
      });

      expect(user.isAdmin).toBe(true);
    });
  });

  describe('findByDiscordId', () => {
    it('존재하지 않는 유저는 null을 반환한다', async () => {
      const user = await repo.findByDiscordId('unknown');
      expect(user).toBeNull();
    });

    it('유저를 team 관계와 함께 반환한다', async () => {
      const team = await teamRepo.save(teamRepo.create({ name: '1조' }));
      await repo.create({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 16,
        department: Department.Node,
      });
      await repo.updateTeamId(['user-1'], team.id);

      const user = await repo.findByDiscordId('user-1');

      expect(user).not.toBeNull();
      expect(user!.team).not.toBeNull();
      expect(user!.team!.name).toBe('1조');
    });
  });

  describe('update', () => {
    it('유저 정보를 업데이트한다', async () => {
      await repo.create({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 16,
        department: Department.Node,
      });

      await repo.update('user-1', {
        nickname: '김길동',
        generation: 17,
        department: Department.Spring,
      });

      const user = await repo.findByDiscordId('user-1');
      expect(user!.nickname).toBe('김길동');
      expect(user!.generation).toBe(17);
      expect(user!.department).toBe(Department.Spring);
    });

    it('업데이트 시 다른 필드를 보존한다', async () => {
      await repo.create({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 16,
        department: Department.Node,
      });
      await repo.addScore('user-1', 50);
      await repo.update('user-1', { isAdmin: true });

      await repo.update('user-1', { nickname: '김길동' });

      const user = await repo.findByDiscordId('user-1');
      expect(user!.nickname).toBe('김길동');
      expect(user!.score).toBe(50);
      expect(user!.isAdmin).toBe(true);
    });
  });

  describe('addScore', () => {
    it('점수를 증가시킨다', async () => {
      await repo.create({
        discordId: 'user-1',
        nickname: '홍길동',
        generation: 16,
        department: Department.Node,
      });

      await repo.addScore('user-1', 10);
      await repo.addScore('user-1', 20);

      const user = await repo.findByDiscordId('user-1');
      expect(user!.score).toBe(30);
    });
  });

  describe('updateTeamId', () => {
    it('여러 유저의 팀을 한번에 변경한다', async () => {
      await repo.create({
        discordId: 'user-1',
        nickname: 'A',
        generation: 16,
        department: Department.Node,
      });
      await repo.create({
        discordId: 'user-2',
        nickname: 'B',
        generation: 16,
        department: Department.Spring,
      });
      const team = await teamRepo.save(teamRepo.create({ name: '1조' }));

      await repo.updateTeamId(['user-1', 'user-2'], team.id);

      const u1 = await repo.findByDiscordId('user-1');
      const u2 = await repo.findByDiscordId('user-2');
      expect(u1!.teamId).toBe(team.id);
      expect(u2!.teamId).toBe(team.id);
    });

    it('빈 배열이면 아무 작업도 하지 않는다', async () => {
      await expect(repo.updateTeamId([], null)).resolves.not.toThrow();
    });
  });

  describe('getTeamRanking', () => {
    it('팀이 없으면 빈 배열을 반환한다', async () => {
      const ranking = await repo.getTeamRanking();
      expect(ranking).toEqual([]);
    });

    it('팀별 점수 합산 랭킹을 반환한다', async () => {
      const team1 = await teamRepo.save(teamRepo.create({ name: '1조' }));
      const team2 = await teamRepo.save(teamRepo.create({ name: '2조' }));

      await repo.create({
        discordId: 'u1',
        nickname: 'A',
        generation: 16,
        department: Department.Node,
      });
      await repo.create({
        discordId: 'u2',
        nickname: 'B',
        generation: 16,
        department: Department.Spring,
      });
      await repo.create({
        discordId: 'u3',
        nickname: 'C',
        generation: 16,
        department: Department.Web,
      });

      await repo.updateTeamId(['u1', 'u2'], team1.id);
      await repo.updateTeamId(['u3'], team2.id);

      await repo.addScore('u1', 30);
      await repo.addScore('u2', 20);
      await repo.addScore('u3', 100);

      const ranking = await repo.getTeamRanking();

      expect(ranking).toHaveLength(2);
      expect(ranking[0].teamName).toBe('2조');
      expect(ranking[0].totalScore).toBe(100);
      expect(ranking[1].teamName).toBe('1조');
      expect(ranking[1].totalScore).toBe(50);
    });
  });
});
