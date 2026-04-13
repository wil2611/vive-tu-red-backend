import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StoryChapter } from './story-chapter.entity';

@Entity('story_assets')
export class StoryAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  altText: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => StoryChapter, (chapter) => chapter.assets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapterId' })
  chapter: StoryChapter;

  @Column()
  chapterId: string;

  @CreateDateColumn()
  createdAt: Date;
}
