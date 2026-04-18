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
      this.ids.add(category.id);
    }
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  async add(id: string, name: string): Promise<boolean> {
    if (this.ids.has(id)) return false;

    await this.repository.insert(id, name);
    this.ids.add(id);
    return true;
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.repository.deleteById(id);
    if (deleted) this.ids.delete(id);
    return deleted;
  }

  async list(): Promise<Category[]> {
    return this.repository.findAll();
  }
}
