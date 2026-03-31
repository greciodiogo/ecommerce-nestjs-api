import { User } from 'src/users/models/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationType {
  ORDER = 'order',
  PRODUCT = 'product',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
  GENERAL = 'general',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type: NotificationType;

  @Column({ nullable: true })
  relatedEntityId?: number;

  @Column({ nullable: true })
  actionUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  user: User;
}
