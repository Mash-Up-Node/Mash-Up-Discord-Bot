import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '../category.service';
import { CATEGORY_REPOSITORY } from '../repositories/category.repository';
import { Category } from '../entities/category.entity';

describe('CategoryService', () => {
  let service: CategoryService;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      insert: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: CATEGORY_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  describe('onModuleInit', () => {
    it('DB에 저장된 카테고리 id를 메모리 Set으로 로드한다', async () => {
      const stored: Category[] = [
        { id: 'cat-1', name: 'A' },
        { id: 'cat-2', name: 'B' },
      ];
      mockRepo.findAll.mockResolvedValue(stored);

      await service.onModuleInit();

      expect(service.has('cat-1')).toBe(true);
      expect(service.has('cat-2')).toBe(true);
      expect(service.has('cat-3')).toBe(false);
    });
  });

  describe('has', () => {
    it('로드되지 않은 id는 false를 반환한다', () => {
      expect(service.has('missing')).toBe(false);
    });
  });

  describe('add', () => {
    it('새 id는 DB에 저장하고 Set에 추가한 뒤 true를 반환한다', async () => {
      mockRepo.insert.mockResolvedValue({ id: 'cat-1', name: 'A' });

      const added = await service.add('cat-1', 'A');

      expect(added).toBe(true);
      expect(mockRepo.insert).toHaveBeenCalledWith('cat-1', 'A');
      expect(service.has('cat-1')).toBe(true);
    });

    it('이미 등록된 id면 false를 반환하고 DB를 호출하지 않는다', async () => {
      mockRepo.findAll.mockResolvedValue([{ id: 'cat-1', name: 'A' }]);
      await service.onModuleInit();

      const added = await service.add('cat-1', 'A-new');

      expect(added).toBe(false);
      expect(mockRepo.insert).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('삭제 성공 시 Set에서 제거하고 true를 반환한다', async () => {
      mockRepo.findAll.mockResolvedValue([{ id: 'cat-1', name: 'A' }]);
      await service.onModuleInit();
      mockRepo.deleteById.mockResolvedValue(true);

      const removed = await service.remove('cat-1');

      expect(removed).toBe(true);
      expect(service.has('cat-1')).toBe(false);
    });

    it('존재하지 않으면 false를 반환한다', async () => {
      mockRepo.deleteById.mockResolvedValue(false);

      const removed = await service.remove('missing');

      expect(removed).toBe(false);
    });
  });

  describe('list', () => {
    it('DB의 전체 카테고리를 반환한다', async () => {
      const stored: Category[] = [
        { id: 'cat-1', name: 'A' },
        { id: 'cat-2', name: 'B' },
      ];
      mockRepo.findAll.mockResolvedValue(stored);

      const result = await service.list();

      expect(result).toEqual(stored);
    });
  });
});
