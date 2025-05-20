import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Attribute } from './attribute.entity';
import { ProductPhoto } from '../product-photos/models/product-photo.entity';
import { ProductRating } from '../../product-ratings/models/product-rating.entity';
import { Shop } from 'src/catalog/shops/models/shop.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @Column()
  name: string;

  @Column({ type: 'double precision', nullable: true })
  price: number;

  @Column({ type: 'double precision', nullable: true })
  purchasePrice: number;

  @Column({ default: true })
  visible: boolean;

  @Column()
  description: string;

  @Column()
  stock: number;

  @OneToMany(() => Attribute, (attribute) => attribute.product, {
    eager: true,
    onDelete: 'CASCADE',
    cascade: true,
  })
  attributes: Attribute[];

  @OneToMany(() => ProductPhoto, (photo) => photo.product, {
    eager: true,
    onDelete: 'CASCADE',
    cascade: true,
  })
  photos: ProductPhoto[];

  @Column({ default: '' })
  photosOrder: string;
  
  @Column({ default: 0 })
  comission: number;

  @OneToMany(() => ProductRating, (rating) => rating.product, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  ratings: ProductRating[];

  @ManyToOne(() => Shop, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shopId' })
  shop: Shop;
  
  @Column({ nullable: true })
  shopId: number;
}
