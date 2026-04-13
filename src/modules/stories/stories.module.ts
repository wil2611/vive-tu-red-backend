import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { Story } from './entities/story.entity';
import { StoryChapter } from './entities/story-chapter.entity';
import { StoryAsset } from './entities/story-asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Story, StoryChapter, StoryAsset])],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
