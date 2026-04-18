import { DataSource, Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryTypeormRepository } from '../repositories/category.typeorm-repository';

describe('CategoryTypeormRepository', () => {
  let dataSource: DataSource;
  let repo: CategoryTypeormRepository;
  let typeormRepo: Repository<CategoryEntity>;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [CategoryEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    typeormRepo = dataSource.getRepository(CategoryEntity);
    repo = new CategoryTypeormRepository(typeormRepo);
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  describe('findAll', () => {
    it('등록된 카테고리가 없으면 빈 배열을 반환한다', async () => {
      const categories = await repo.findAll();
      expect(categories).toEqual([]);
    });

    it('모든 카테고리를 반환한다', async () => {
      await repo.insert('cat-1', '스터디A');
      await repo.insert('cat-2', '스터디B');

      const categories = await repo.findAll();

      expect(categories).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('존재하지 않으면 null을 반환한다', async () => {
      const category = await repo.findById('missing');
      expect(category).toBeNull();
    });

    it('존재하면 해당 카테고리를 반환한다', async () => {
      await repo.insert('cat-1', '스터디A');

      const category = await repo.findById('cat-1');

      expect(category).not.toBeNull();
      expect(category!.id).toBe('cat-1');
      expect(category!.name).toBe('스터디A');
    });
  });

  describe('insert', () => {
    it('새 카테고리를 저장하고 반환한다', async () => {
      const category = await repo.insert('cat-1', '스터디A');

      expect(category.id).toBe('cat-1');
      expect(category.name).toBe('스터디A');
    });
  });

  describe('deleteById', () => {
    it('존재하지 않는 id면 false를 반환한다', async () => {
      const deleted = await repo.deleteById('missing');
      expect(deleted).toBe(false);
    });

    it('삭제에 성공하면 true를 반환한다', async () => {
      await repo.insert('cat-1', '스터디A');

      const deleted = await repo.deleteById('cat-1');

      expect(deleted).toBe(true);
      expect(await repo.findById('cat-1')).toBeNull();
    });
  });
});
