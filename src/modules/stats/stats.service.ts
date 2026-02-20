import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PageView } from './entities/page-view.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { CreatePageViewDto } from './dto/create-page-view.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(PageView)
    private readonly pageViewRepository: Repository<PageView>,
    @InjectRepository(UserInteraction)
    private readonly interactionRepository: Repository<UserInteraction>,
  ) {}

  async trackPageView(
    createPageViewDto: CreatePageViewDto,
    userAgent?: string,
    ip?: string,
  ): Promise<PageView> {
    const pageView = this.pageViewRepository.create({
      ...createPageViewDto,
      userAgent,
      ip,
    });
    return this.pageViewRepository.save(pageView);
  }

  async trackInteraction(
    createInteractionDto: CreateInteractionDto,
  ): Promise<UserInteraction> {
    const interaction = this.interactionRepository.create(createInteractionDto);
    return this.interactionRepository.save(interaction);
  }

  async getOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalPageViews,
      last30DaysViews,
      last7DaysViews,
      totalInteractions,
      bookReads,
      resourceDownloads,
      networksCreated,
      topPages,
      interactionsByType,
    ] = await Promise.all([
      this.pageViewRepository.count(),
      this.pageViewRepository.count({
        where: { createdAt: Between(thirtyDaysAgo, now) },
      }),
      this.pageViewRepository.count({
        where: { createdAt: Between(sevenDaysAgo, now) },
      }),
      this.interactionRepository.count(),
      this.interactionRepository.count({
        where: { type: 'book_read' },
      }),
      this.interactionRepository.count({
        where: { type: 'resource_download' },
      }),
      this.interactionRepository.count({
        where: { type: 'network_created' },
      }),
      this.getTopPages(10),
      this.getInteractionsByType(),
    ]);

    return {
      pageViews: {
        total: totalPageViews,
        last30Days: last30DaysViews,
        last7Days: last7DaysViews,
      },
      interactions: {
        total: totalInteractions,
        bookReads,
        resourceDownloads,
        networksCreated,
      },
      topPages,
      interactionsByType,
    };
  }

  private async getTopPages(limit: number) {
    return this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.path', 'path')
      .addSelect('COUNT(*)', 'views')
      .groupBy('pv.path')
      .orderBy('views', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  private async getInteractionsByType() {
    return this.interactionRepository
      .createQueryBuilder('ui')
      .select('ui.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ui.type')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  async getPageViewsByDate(startDate: Date, endDate: Date) {
    return this.pageViewRepository
      .createQueryBuilder('pv')
      .select("DATE(pv.createdAt)", 'date')
      .addSelect('COUNT(*)', 'views')
      .where('pv.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
  }
}
