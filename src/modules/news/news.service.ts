import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { News } from './entities/news.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
  ) {}

  private normalizeRequiredText(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} debe ser texto valido`);
    }

    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldName} no puede estar vacio`);
    }

    return normalized;
  }

  private normalizeOptionalText(value: unknown): string | null {
    if (value === undefined || value === null) return null;

    if (typeof value !== 'string') {
      throw new BadRequestException('El valor enviado debe ser texto valido');
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeDate(value: unknown): Date | null {
    if (value === undefined || value === null || value === '') return null;

    const parsedDate = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('publishedAt debe ser una fecha valida.');
    }

    return parsedDate;
  }

  private slugify(value: string): string {
    const normalized = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90);

    return normalized || 'noticia';
  }

  private async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const qb = this.newsRepository
      .createQueryBuilder('news')
      .where('news.slug = :slug', { slug });

    if (excludeId) {
      qb.andWhere('news.id != :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    return !!existing;
  }

  private async buildUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = this.slugify(title);
    let candidateSlug = baseSlug;
    let suffix = 1;

    while (await this.slugExists(candidateSlug, excludeId)) {
      suffix += 1;
      candidateSlug = `${baseSlug}-${suffix}`;
    }

    return candidateSlug;
  }

  async create(createNewsDto: CreateNewsDto): Promise<News> {
    const title = this.normalizeRequiredText(createNewsDto.title, 'El titulo');
    const body = this.normalizeRequiredText(createNewsDto.body, 'El cuerpo');
    const isPublished = createNewsDto.isPublished ?? false;

    let publishedAt = this.normalizeDate(createNewsDto.publishedAt);
    if (isPublished && !publishedAt) {
      publishedAt = new Date();
    }
    if (!isPublished) {
      publishedAt = null;
    }

    const news = this.newsRepository.create({
      title,
      slug: await this.buildUniqueSlug(title),
      excerpt: this.normalizeOptionalText(createNewsDto.excerpt),
      body,
      coverImageUrl: this.normalizeOptionalText(createNewsDto.coverImageUrl),
      coverImageAlt: this.normalizeOptionalText(createNewsDto.coverImageAlt),
      authorName: this.normalizeOptionalText(createNewsDto.authorName),
      isPublished,
      publishedAt,
    });

    return this.newsRepository.save(news);
  }

  async findAll(): Promise<News[]> {
    return this.newsRepository
      .createQueryBuilder('news')
      .orderBy('news.isPublished', 'DESC')
      .addOrderBy('news.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('news.createdAt', 'DESC')
      .getMany();
  }

  async findPublished(): Promise<News[]> {
    return this.newsRepository
      .createQueryBuilder('news')
      .where('news.isPublished = :isPublished', { isPublished: true })
      .andWhere('(news.publishedAt IS NULL OR news.publishedAt <= :now)', {
        now: new Date(),
      })
      .orderBy('news.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('news.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<News> {
    const news = await this.newsRepository.findOne({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException('Noticia no encontrada');
    }

    return news;
  }

  async update(id: string, updateNewsDto: UpdateNewsDto): Promise<News> {
    const news = await this.findById(id);

    if (updateNewsDto.title !== undefined) {
      const normalizedTitle = this.normalizeRequiredText(
        updateNewsDto.title,
        'El titulo',
      );
      if (normalizedTitle !== news.title) {
        news.title = normalizedTitle;
        news.slug = await this.buildUniqueSlug(normalizedTitle, news.id);
      }
    }

    if (updateNewsDto.excerpt !== undefined) {
      news.excerpt = this.normalizeOptionalText(updateNewsDto.excerpt);
    }

    if (updateNewsDto.body !== undefined) {
      news.body = this.normalizeRequiredText(updateNewsDto.body, 'El cuerpo');
    }

    if (updateNewsDto.coverImageUrl !== undefined) {
      news.coverImageUrl = this.normalizeOptionalText(updateNewsDto.coverImageUrl);
    }

    if (updateNewsDto.coverImageAlt !== undefined) {
      news.coverImageAlt = this.normalizeOptionalText(updateNewsDto.coverImageAlt);
    }

    if (updateNewsDto.authorName !== undefined) {
      news.authorName = this.normalizeOptionalText(updateNewsDto.authorName);
    }

    const nextIsPublished = updateNewsDto.isPublished ?? news.isPublished;
    let nextPublishedAt = news.publishedAt;

    if (updateNewsDto.publishedAt !== undefined) {
      nextPublishedAt = this.normalizeDate(updateNewsDto.publishedAt);
    }

    if (!nextIsPublished) {
      nextPublishedAt = null;
    } else if (!nextPublishedAt) {
      nextPublishedAt = new Date();
    }

    news.isPublished = nextIsPublished;
    news.publishedAt = nextPublishedAt;

    return this.newsRepository.save(news);
  }

  async remove(id: string): Promise<{ message: string }> {
    const news = await this.findById(id);
    await this.newsRepository.remove(news);
    return { message: 'Noticia eliminada exitosamente' };
  }
}
