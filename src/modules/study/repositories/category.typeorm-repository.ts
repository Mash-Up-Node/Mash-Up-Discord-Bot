import { Repository } from 'typeorm';
import { CategoryEntity, Category } from '../entities/category.entity';
import { CategoryRepository } from './category.repository';

export class CategoryTypeormRepository implements CategoryRepository {
  constructor(private readonly repo: Repository<CategoryEntity>) {}

  async findAll(): Promise<Category[]> {
    return this.repo.find();
  }

  async findByCategoryId(categoryId: string): Promise<Category | null> {
    return this.repo.findOne({ where: { categoryId } });
  }

  async insert(categoryId: string, name: string): Promise<Category> {
    const category = this.repo.create({ categoryId, name });
    return this.repo.save(category);
  }
}
