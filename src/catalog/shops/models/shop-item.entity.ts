import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/models/product.entity';
import { Shop } from './shop.entity';

@Entity('shop_items')
export class ShopItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shop, (shop) => shop.products, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  shop: Shop;

  @ManyToOne(() => Product)
  product: Product;

}
