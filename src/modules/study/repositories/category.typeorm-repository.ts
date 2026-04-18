import { Repository } from 'typeorm';
import { CategoryEntity, Category } from '../entities/category.entity';
import { CategoryRepository } from './category.repository';

export class CategoryTypeormRepository implements CategoryRepository {
  constructor(private readonly repo: Repository<CategoryEntity>) {}

  async findAll(): Promise<Category[]> {
    return this.repo.find();
  }

  async findById(id: string): Promise<Category | null> {
    return this.repo.findOne({ where: { id } });
  }

  async insert(id: string, name: string): Promise<Category> {
    const category = this.repo.create({ id, name });
    return this.repo.save(category);
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
