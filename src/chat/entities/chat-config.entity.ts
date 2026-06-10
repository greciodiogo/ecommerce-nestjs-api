import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('chat_config')
export class ChatConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @Column({ default: 'Sino' })
  assistantName: string;

  @Column({ type: 'text', default: 'Como posso ajudar você hoje?' })
  welcomeMessage: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', default: 'Olá, amigo! 👋🏾' })
  greetingMessage: string;

  @Column({ type: 'text', default: 'Olá, {name}! 👋🏾' })
  greetingMessageWithName: string;

  @Column({ type: 'json', nullable: true })
  quickReplies: Array<{
    icon: string;
    label: string;
    message: string;
  }>;

  @Column({ default: true })
  isActive: boolean;
}
