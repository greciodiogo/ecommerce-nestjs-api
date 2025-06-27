import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { ShopkeeperSale } from './shopkeepersale.entity';
import { Product } from '../../catalog/products/models/product.entity';

@Entity('shopkeeper_sale_products')
export class ShopkeeperSaleProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ShopkeeperSale, (sale) => sale.products, { onDelete: 'CASCADE' })
  shopkeeperSale: ShopkeeperSale;

  @ManyToOne(() => Product, { eager: true, onDelete: 'CASCADE' })
  product: Product;

  @Column('int')
  quantity: number;
} 