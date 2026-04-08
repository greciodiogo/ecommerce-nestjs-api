import { User } from 'src/users/models/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';

@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'text', unique: true })
  @Index()
  token: string;

  @Column({ nullable: true })
  deviceName?: string;

  @Column({ default: 'mobile' })
  deviceType: string; // 'web', 'android', 'ios', 'mobile'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
