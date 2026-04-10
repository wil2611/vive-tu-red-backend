import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_interactions')
@Index('IDX_USER_INTERACTIONS_CREATED_AT', ['createdAt'])
@Index('IDX_USER_INTERACTIONS_TYPE', ['type'])
@Index('IDX_USER_INTERACTIONS_SESSION_ID', ['sessionId'])
@Index('IDX_USER_INTERACTIONS_TYPE_CREATED_AT', ['type', 'createdAt'])
export class UserInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // 'book_read', 'resource_open', 'network_created', etc.

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
