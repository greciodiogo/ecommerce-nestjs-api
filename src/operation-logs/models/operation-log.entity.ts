import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class OperationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  action: string;

  @Column()
  entity: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  details: any;

  @CreateDateColumn()
  timestamp: Date;
} 