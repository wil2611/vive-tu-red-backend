import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './entities/story.entity';
import { StoryChapter } from './entities/story-chapter.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(StoryChapter)
    private readonly chapterRepository: Repository<StoryChapter>,
  ) {}

  async createStory(createStoryDto: CreateStoryDto): Promise<Story> {
    const story = this.storyRepository.create(createStoryDto);
    return this.storyRepository.save(story);
  }

  async findAllStories(): Promise<Story[]> {
    return this.storyRepository.find({
      order: { order: 'ASC' },
      relations: ['chapters'],
    });
  }

  async findPublishedStories(): Promise<Story[]> {
    return this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect(
        'story.chapters',
        'chapter',
        'chapter.isPublished = :isChapterPublished',
        { isChapterPublished: true },
      )
      .where('story.isPublished = :isStoryPublished', {
        isStoryPublished: true,
      })
      .orderBy('story.order', 'ASC')
      .addOrderBy('chapter.order', 'ASC')
      .getMany();
  }

  async findStoryById(id: string): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id },
      relations: ['chapters', 'chapters.assets'],
    });
    if (!story) {
      throw new NotFoundException('Historia no encontrada');
    }
    return story;
  }

  async findPublishedStoryById(id: string): Promise<Story> {
    const story = await this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect(
        'story.chapters',
        'chapter',
        'chapter.isPublished = :isChapterPublished',
        { isChapterPublished: true },
      )
      .leftJoinAndSelect('chapter.assets', 'asset')
      .where('story.id = :id', { id })
      .andWhere('story.isPublished = :isStoryPublished', {
        isStoryPublished: true,
      })
      .orderBy('story.order', 'ASC')
      .addOrderBy('chapter.order', 'ASC')
      .addOrderBy('asset.order', 'ASC')
      .getOne();

    if (!story) {
      throw new NotFoundException('Historia no encontrada');
    }

    return story;
  }

  async updateStory(
    id: string,
    updateStoryDto: UpdateStoryDto,
  ): Promise<Story> {
    const story = await this.findStoryById(id);
    Object.assign(story, updateStoryDto);
    return this.storyRepository.save(story);
  }

  async removeStory(id: string): Promise<{ message: string }> {
    const story = await this.findStoryById(id);
    await this.storyRepository.remove(story);
    return { message: 'Historia eliminada exitosamente' };
  }

  async createChapter(
    createChapterDto: CreateChapterDto,
  ): Promise<StoryChapter> {
    await this.findStoryById(createChapterDto.storyId);
    const chapter = this.chapterRepository.create(createChapterDto);
    return this.chapterRepository.save(chapter);
  }

  async findChapterById(id: string): Promise<StoryChapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
      relations: ['assets'],
    });
    if (!chapter) {
      throw new NotFoundException('Capitulo no encontrado');
    }
    return chapter;
  }

  async findPublishedChapterById(id: string): Promise<StoryChapter> {
    const chapter = await this.chapterRepository
      .createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.assets', 'asset')
      .leftJoin('chapter.story', 'story')
      .where('chapter.id = :id', { id })
      .andWhere('chapter.isPublished = :isChapterPublished', {
        isChapterPublished: true,
      })
      .andWhere('story.isPublished = :isStoryPublished', {
        isStoryPublished: true,
      })
      .orderBy('asset.order', 'ASC')
      .getOne();

    if (!chapter) {
      throw new NotFoundException('Capitulo no encontrado');
    }

    return chapter;
  }

  async findChaptersByStory(storyId: string): Promise<StoryChapter[]> {
    return this.chapterRepository.find({
      where: { storyId },
      order: { order: 'ASC' },
      relations: ['assets'],
    });
  }

  async findPublishedChaptersByStory(storyId: string): Promise<StoryChapter[]> {
    await this.findPublishedStoryById(storyId);
    return this.chapterRepository.find({
      where: { storyId, isPublished: true },
      order: { order: 'ASC' },
      relations: ['assets'],
    });
  }

  async updateChapter(
    id: string,
    updateChapterDto: UpdateChapterDto,
  ): Promise<StoryChapter> {
    const chapter = await this.findChapterById(id);
    Object.assign(chapter, updateChapterDto);
    return this.chapterRepository.save(chapter);
  }

  async removeChapter(id: string): Promise<{ message: string }> {
    const chapter = await this.findChapterById(id);
    await this.chapterRepository.remove(chapter);
    return { message: 'Capitulo eliminado exitosamente' };
  }
}
