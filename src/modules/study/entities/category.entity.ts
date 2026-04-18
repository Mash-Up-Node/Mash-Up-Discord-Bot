import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;
}

export interface Category {
  id: string;
  name: string;
}
