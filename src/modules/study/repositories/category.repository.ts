import { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findByCategoryId(categoryId: string): Promise<Category | null>;
  insert(categoryId: string, name: string): Promise<Category>;
}
