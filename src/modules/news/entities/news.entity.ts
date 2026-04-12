import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  NEWS_AUTHOR_NAME_MAX_LENGTH,
  NEWS_COVER_IMAGE_ALT_MAX_LENGTH,
  NEWS_COVER_IMAGE_URL_MAX_LENGTH,
  NEWS_SLUG_MAX_LENGTH,
  NEWS_TITLE_MAX_LENGTH,
} from '../news.constants';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: NEWS_TITLE_MAX_LENGTH })
  title: string;

  @Column({
    type: 'varchar',
    unique: true,
    length: NEWS_SLUG_MAX_LENGTH,
  })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'varchar',
    nullable: true,
    length: NEWS_COVER_IMAGE_URL_MAX_LENGTH,
  })
  coverImageUrl: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    length: NEWS_COVER_IMAGE_ALT_MAX_LENGTH,
  })
  coverImageAlt: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    length: NEWS_AUTHOR_NAME_MAX_LENGTH,
  })
  authorName: string | null;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
