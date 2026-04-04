import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { PageView } from './entities/page-view.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { CreatePageViewDto } from './dto/create-page-view.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { GetDashboardStatsDto } from './dto/get-dashboard-stats.dto';

type DateRange = {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
  days: number;
};

type RawCountRow = {
  date: string;
  value: string;
};

type RawTopPageRow = {
  path: string;
  views: string;
};

type RawInteractionRow = {
  type: string;
  count: string;
};

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

  async getDashboard(query: GetDashboardStatsDto) {
    const range = this.resolveDateRange(query);

    const [
      pageViewsCurrent,
      pageViewsPrevious,
      interactionsCurrent,
      interactionsPrevious,
      resourceDownloadsCurrent,
      resourceDownloadsPrevious,
      bookReadsCurrent,
      bookReadsPrevious,
      networksCreatedCurrent,
      networksCreatedPrevious,
      contactSubmittedCurrent,
      contactSubmittedPrevious,
      uniqueSessionsCurrent,
      uniqueSessionsPrevious,
      dailyPageViews,
      dailyInteractions,
      topPages,
      topInteractions,
    ] = await Promise.all([
      this.countPageViews(range.startDate, range.endDate),
      this.countPageViews(range.previousStartDate, range.previousEndDate),
      this.countInteractions(range.startDate, range.endDate),
      this.countInteractions(range.previousStartDate, range.previousEndDate),
      this.countInteractionsByType(
        'resource_download',
        range.startDate,
        range.endDate,
      ),
      this.countInteractionsByType(
        'resource_download',
        range.previousStartDate,
        range.previousEndDate,
      ),
      this.countInteractionsByType('book_read', range.startDate, range.endDate),
      this.countInteractionsByType(
        'book_read',
        range.previousStartDate,
        range.previousEndDate,
      ),
      this.countInteractionsByType(
        'network_created',
        range.startDate,
        range.endDate,
      ),
      this.countInteractionsByType(
        'network_created',
        range.previousStartDate,
        range.previousEndDate,
      ),
      this.countInteractionsByType(
        'contact_submitted',
        range.startDate,
        range.endDate,
      ),
      this.countInteractionsByType(
        'contact_submitted',
        range.previousStartDate,
        range.previousEndDate,
      ),
      this.countUniqueSessions(range.startDate, range.endDate),
      this.countUniqueSessions(range.previousStartDate, range.previousEndDate),
      this.getDailyPageViews(range.startDate, range.endDate),
      this.getDailyInteractions(range.startDate, range.endDate),
      this.getTopPages(10, range.startDate, range.endDate),
      this.getInteractionsByType(10, range.startDate, range.endDate),
    ]);

    const engagementRateCurrent = this.calculateRate(
      interactionsCurrent,
      pageViewsCurrent,
    );
    const engagementRatePrevious = this.calculateRate(
      interactionsPrevious,
      pageViewsPrevious,
    );

    return {
      range: {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        previousStartDate: range.previousStartDate.toISOString(),
        previousEndDate: range.previousEndDate.toISOString(),
        days: range.days,
      },
      kpis: {
        pageViews: this.buildKpi(pageViewsCurrent, pageViewsPrevious),
        interactions: this.buildKpi(interactionsCurrent, interactionsPrevious),
        uniqueSessions: this.buildKpi(
          uniqueSessionsCurrent,
          uniqueSessionsPrevious,
        ),
        resourceDownloads: this.buildKpi(
          resourceDownloadsCurrent,
          resourceDownloadsPrevious,
        ),
        bookReads: this.buildKpi(bookReadsCurrent, bookReadsPrevious),
        networksCreated: this.buildKpi(
          networksCreatedCurrent,
          networksCreatedPrevious,
        ),
        contactSubmitted: this.buildKpi(
          contactSubmittedCurrent,
          contactSubmittedPrevious,
        ),
        engagementRate: {
          value: engagementRateCurrent,
          previousValue: engagementRatePrevious,
          changePct: this.calculatePercentChange(
            engagementRateCurrent,
            engagementRatePrevious,
          ),
        },
      },
      series: {
        pageViewsByDay: dailyPageViews,
        interactionsByDay: dailyInteractions,
      },
      topPages,
      interactionsByType: topInteractions,
    };
  }

  private resolveDateRange(query: GetDashboardStatsDto): DateRange {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    const rangeDays = query.rangeDays ?? 30;

    let startDate: Date;
    let endDate: Date;

    if (query.from && query.to) {
      startDate = new Date(query.from);
      endDate = new Date(query.to);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (startDate > endDate) {
        const swap = startDate;
        startDate = endDate;
        endDate = swap;
      }
    } else {
      endDate = now;
      startDate = new Date(endDate.getTime() - (rangeDays - 1) * dayMs);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const days = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime() + 1) / dayMs),
    );
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - days * dayMs + 1);

    return {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      days,
    };
  }

  private calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private calculateRate(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0;
    return Number(((numerator / denominator) * 100).toFixed(2));
  }

  private buildKpi(current: number, previous: number) {
    return {
      value: current,
      previousValue: previous,
      changePct: this.calculatePercentChange(current, previous),
    };
  }

  private async countPageViews(startDate: Date, endDate: Date): Promise<number> {
    return this.pageViewRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });
  }

  private async countInteractions(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.interactionRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });
  }

  private async countInteractionsByType(
    type: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.interactionRepository.count({
      where: { type, createdAt: Between(startDate, endDate) },
    });
  }

  private async countUniqueSessions(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const [pageViewSessions, interactionSessions] = await Promise.all([
      this.pageViewRepository
        .createQueryBuilder('pv')
        .select('DISTINCT pv.sessionId', 'sessionId')
        .where('pv.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .andWhere('pv.sessionId IS NOT NULL')
        .getRawMany<{ sessionId: string }>(),
      this.interactionRepository
        .createQueryBuilder('ui')
        .select('DISTINCT ui.sessionId', 'sessionId')
        .where('ui.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .andWhere('ui.sessionId IS NOT NULL')
        .getRawMany<{ sessionId: string }>(),
    ]);

    const unique = new Set<string>();
    for (const row of pageViewSessions) {
      if (row.sessionId) unique.add(row.sessionId);
    }
    for (const row of interactionSessions) {
      if (row.sessionId) unique.add(row.sessionId);
    }
    return unique.size;
  }

  private async getDailyPageViews(startDate: Date, endDate: Date) {
    const offsetMinutes = this.getServerTimezoneOffsetMinutes();

    const rows = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select(
        "DATE(pv.createdAt - (:offsetMinutes * INTERVAL '1 minute'))",
        'date',
      )
      .addSelect('COUNT(*)', 'value')
      .where('pv.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .setParameter('offsetMinutes', offsetMinutes)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<RawCountRow>();

    return this.fillDailySeries(rows, startDate, endDate);
  }

  private async getDailyInteractions(startDate: Date, endDate: Date) {
    const offsetMinutes = this.getServerTimezoneOffsetMinutes();

    const rows = await this.interactionRepository
      .createQueryBuilder('ui')
      .select(
        "DATE(ui.createdAt - (:offsetMinutes * INTERVAL '1 minute'))",
        'date',
      )
      .addSelect('COUNT(*)', 'value')
      .where('ui.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .setParameter('offsetMinutes', offsetMinutes)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<RawCountRow>();

    return this.fillDailySeries(rows, startDate, endDate);
  }

  private fillDailySeries(rows: RawCountRow[], startDate: Date, endDate: Date) {
    const dayMs = 24 * 60 * 60 * 1000;
    const valuesByDay = new Map<string, number>();

    for (const row of rows) {
      valuesByDay.set(
        this.normalizeDateKey(row.date),
        Number.parseInt(row.value, 10) || 0,
      );
    }

    const series: Array<{ date: string; value: number }> = [];
    for (
      let cursor = new Date(startDate.getTime());
      cursor <= endDate;
      cursor = new Date(cursor.getTime() + dayMs)
    ) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      series.push({
        date: key,
        value: valuesByDay.get(key) ?? 0,
      });
    }

    return series;
  }

  private normalizeDateKey(value: string): string {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return value;
  }

  private getServerTimezoneOffsetMinutes(): number {
    return new Date().getTimezoneOffset();
  }

  private async getTopPages(
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    const query = this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.path', 'path')
      .addSelect('COUNT(*)', 'views');

    if (startDate && endDate) {
      query.where('pv.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const rows = await query
      .groupBy('pv.path')
      .orderBy('views', 'DESC')
      .limit(limit)
      .getRawMany<RawTopPageRow>();

    return rows.map((row) => ({
      path: row.path,
      views: Number.parseInt(row.views, 10) || 0,
    }));
  }

  private async getInteractionsByType(
    limit = 20,
    startDate?: Date,
    endDate?: Date,
  ) {
    const query = this.interactionRepository
      .createQueryBuilder('ui')
      .select('ui.type', 'type')
      .addSelect('COUNT(*)', 'count');

    if (startDate && endDate) {
      query.where('ui.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const rows = await query
      .groupBy('ui.type')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<RawInteractionRow>();

    return rows.map((row) => ({
      type: row.type,
      count: Number.parseInt(row.count, 10) || 0,
    }));
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
