import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Category } from './entities/category.entity';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from './repositories/category.repository';

@Injectable()
export class CategoryService implements OnModuleInit {
  private readonly ids = new Set<string>();

  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repository: CategoryRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const categories = await this.repository.findAll();
    for (const category of categories) {
      this.ids.add(category.categoryId);
    }
  }

  has(categoryId: string): boolean {
    return this.ids.has(categoryId);
  }

  async add(categoryId: string, name: string): Promise<boolean> {
    if (this.ids.has(categoryId)) return false;

    await this.repository.insert(categoryId, name);
    this.ids.add(categoryId);
    return true;
  }

  async list(): Promise<Category[]> {
    return this.repository.findAll();
  }
}
