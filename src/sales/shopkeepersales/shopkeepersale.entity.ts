import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Shop } from '../../catalog/shops/models/shop.entity';
import { Product } from '../../catalog/products/models/product.entity';

@Entity('shopkeeper_sales')
export class ShopkeeperSale {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @Column({ nullable: false, unique: true })
  order_number: string;

  @ManyToOne(() => Shop, { nullable: false, onDelete: 'CASCADE' })
  shop: Shop;

  @ManyToMany(() => Product)
  @JoinTable({ name: 'shopkeeper_sale_products' })
  products: Product[];

  @Column('int')
  quantity: number;
} 