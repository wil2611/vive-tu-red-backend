import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Story } from './story.entity';
import { StoryAsset } from './story-asset.entity';

@Entity('story_chapters')
export class StoryChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ nullable: true })
  summary: string;

  @ManyToOne(() => Story, (story) => story.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storyId' })
  story: Story;

  @Column()
  storyId: string;

  @OneToMany(() => StoryAsset, (asset) => asset.chapter, { cascade: true })
  assets: StoryAsset[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
