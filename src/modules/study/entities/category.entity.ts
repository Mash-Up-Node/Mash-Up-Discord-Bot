import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'category_id', type: 'varchar', unique: true })
  categoryId!: string;

  @Column({ type: 'varchar' })
  name!: string;
}

export interface Category {
  id: number;
  categoryId: string;
  name: string;
}
