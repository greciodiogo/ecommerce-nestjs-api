import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../users/models/user.entity';
import { ShopItem } from './shop-item.entity';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  user?: User;

  @OneToMany(() => ShopItem, (item) => item.product, {
    cascade: true,
  })
  products: ShopItem[];

  @Column()
  shopName: string;

  @Column()
  alvara: string;

  @Column()
  nif: string;

  @Column()
  contactPhone: string;

  @Column({ nullable: true })
  address?: string;

}
