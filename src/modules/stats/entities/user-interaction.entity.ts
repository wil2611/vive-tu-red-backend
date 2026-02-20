import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_interactions')
export class UserInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // 'book_read', 'resource_download', 'network_created', etc.

  @Column({ nullable: true })
  targetId: string; // ID del recurso relacionado

  @Column({ nullable: true })
  targetType: string; // 'story', 'resource', 'chapter', etc.

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;
}
