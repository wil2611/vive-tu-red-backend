import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('page_views')
@Index('IDX_PAGE_VIEWS_CREATED_AT', ['createdAt'])
@Index('IDX_PAGE_VIEWS_SESSION_ID', ['sessionId'])
@Index('IDX_PAGE_VIEWS_PATH_CREATED_AT', ['path', 'createdAt'])
export class PageView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
}
