import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { StoryChapter } from './story-chapter.entity';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => StoryChapter, (chapter) => chapter.story, {
    cascade: true,
    eager: true,
  })
  chapters: StoryChapter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
