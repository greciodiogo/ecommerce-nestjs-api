import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../../catalog/categories/models/category.entity';
import { Product } from 'src/catalog/products/models/product.entity';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  discount: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  products: Product[];
} 