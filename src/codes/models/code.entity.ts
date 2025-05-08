import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('codes')
export class Code {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  // @Index({ unique: true })
  @Column({ nullable: false })
  email: string;
  
  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  expiresAt: Date;

  @Column({ default: true })
  visible: boolean;
}
