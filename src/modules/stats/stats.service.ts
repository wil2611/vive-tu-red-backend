import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Not, Repository } from 'typeorm';
import { PageView } from './entities/page-view.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { ContactMessage } from '../contact/entities/contact-message.entity';
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

type KpiMetric = {
  value: number;
  previousValue: number;
  changePct: number;
};

type DashboardResponse = {
  range: {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
    days: number;
  };
  kpis: {
    pageViews: KpiMetric;
    interactions: KpiMetric;
    uniqueSessions: KpiMetric;
    resourceOpens: KpiMetric;
    bookReads: KpiMetric;
    networksCreated: KpiMetric;
    contactSubmitted: KpiMetric;
    engagementRate: KpiMetric;
  };
  series: {
    pageViewsByDay: Array<{ date: string; value: number }>;
    interactionsByDay: Array<{ date: string; value: number }>;
  };
  topPages: Array<{ path: string; views: number }>;
  interactionsByType: Array<{ type: string; count: number }>;
};

@Injectable()
export class StatsService {
  private static readonly BUSINESS_TIMEZONE = 'America/Bogota';
  private static readonly BUSINESS_TIMEZONE_OFFSET_MINUTES = 300;
  private static readonly DASHBOARD_CACHE_TTL_MS = 45_000;
  private static readonly DASHBOARD_CACHE_MAX_ENTRIES = 100;

  private readonly dashboardCache = new Map<
    string,
    { expiresAt: number; data: DashboardResponse }
  >();

  constructor(
    @InjectRepository(PageView)
    private readonly pageViewRepository: Repository<PageView>,
    @InjectRepository(UserInteraction)
    private readonly interactionRepository: Repository<UserInteraction>,
    @InjectRepository(ContactMessage)
    private readonly contactMessageRepository: Repository<ContactMessage>,
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
    const savedPageView = await this.pageViewRepository.save(pageView);
    this.invalidateDashboardCache();
    return savedPageView;
  }

  async trackInteraction(
    createInteractionDto: CreateInteractionDto,
  ): Promise<UserInteraction> {
    const interaction = this.interactionRepository.create(createInteractionDto);
    const savedInteraction = await this.interactionRepository.save(interaction);
    this.invalidateDashboardCache();
    return savedInteraction;
  }

  invalidateDashboardCachePublic(): void {
    this.invalidateDashboardCache();
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
      resourceOpens,
      networksCreated,
      topPages,
      interactionsByType,
    ] = await Promise.all([
      this.countPublicPageViews(),
      this.countPublicPageViews(thirtyDaysAgo, now),
      this.countPublicPageViews(sevenDaysAgo, now),
      this.interactionRepository.count(),
      this.interactionRepository.count({
        where: { type: 'book_read' },
      }),
      this.countInteractionsByTypes(['resource_open', 'resource_download']),
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
        resourceOpens,
        networksCreated,
      },
      topPages,
      interactionsByType,
    };
  }

  async getDashboard(query: GetDashboardStatsDto): Promise<DashboardResponse> {
    const range = this.resolveDateRange(query);
    const cacheKey = this.buildDashboardCacheKey(range);
    const cachedDashboard = this.getCachedDashboard(cacheKey);
    if (cachedDashboard) {
      return cachedDashboard;
    }

    const [
      pageViewsCurrent,
      pageViewsPrevious,
      interactionsCurrent,
      interactionsPrevious,
      resourceOpensCurrent,
      resourceOpensPrevious,
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
      this.countInteractionsByTypes(
        ['resource_open', 'resource_download'],
        range.startDate,
        range.endDate,
      ),
      this.countInteractionsByTypes(
        ['resource_open', 'resource_download'],
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
      this.countContactMessages(range.startDate, range.endDate),
      this.countContactMessages(range.previousStartDate, range.previousEndDate),
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

    const dashboard: DashboardResponse = {
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
        resourceOpens: this.buildKpi(
          resourceOpensCurrent,
          resourceOpensPrevious,
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

    this.setCachedDashboard(cacheKey, dashboard);
    return dashboard;
  }

  private resolveDateRange(query: GetDashboardStatsDto): DateRange {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    const rangeDays = query.rangeDays ?? 30;

    let startDateKey: string;
    let endDateKey: string;

    if (query.from || query.to) {
      const fromDateKey = this.toBusinessDateKey(query.from ?? query.to ?? '');
      const toDateKey = this.toBusinessDateKey(query.to ?? query.from ?? '');

      if (fromDateKey <= toDateKey) {
        startDateKey = fromDateKey;
        endDateKey = toDateKey;
      } else {
        startDateKey = toDateKey;
        endDateKey = fromDateKey;
      }
    } else {
      endDateKey = this.formatDateInTimezone(
        now,
        StatsService.BUSINESS_TIMEZONE,
      );
      startDateKey = this.addDaysToDateKey(endDateKey, -(rangeDays - 1));
    }

    const startDate = this.businessDayStartToUtc(startDateKey);
    const endDate = this.businessDayEndToUtc(endDateKey);
    const days = this.countDaysInclusiveByDateKey(startDateKey, endDateKey);
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(
      previousEndDate.getTime() - days * dayMs + 1,
    );

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

  private async countPageViews(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.countPublicPageViews(startDate, endDate);
  }

  private async countPublicPageViews(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    if (startDate && endDate) {
      const { startDateSql, endDateSql } = this.toSqlDateRange(
        startDate,
        endDate,
      );

      const rawRows = await this.pageViewRepository
        .createQueryBuilder('pv')
        .select('COUNT(*)', 'value')
        .where('pv.createdAt BETWEEN :startDate AND :endDate', {
          startDate: startDateSql,
          endDate: endDateSql,
        })
        .andWhere('pv.path NOT LIKE :adminPath', {
          adminPath: '/admin%',
        })
        .getRawOne<{ value?: string }>();

      return Number.parseInt(rawRows?.value ?? '0', 10) || 0;
    }

    return this.pageViewRepository.count({
      where: {
        path: Not(Like('/admin%')),
      },
    });
  }

  private async countInteractions(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const { startDateSql, endDateSql } = this.toSqlDateRange(startDate, endDate);

    const rawRow = await this.interactionRepository
      .createQueryBuilder('ui')
      .select('COUNT(*)', 'value')
      .where('ui.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDateSql,
        endDate: endDateSql,
      })
      .getRawOne<{ value?: string }>();

    return Number.parseInt(rawRow?.value ?? '0', 10) || 0;
  }

  private async countInteractionsByType(
    type: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const { startDateSql, endDateSql } = this.toSqlDateRange(startDate, endDate);

    const rawRow = await this.interactionRepository
      .createQueryBuilder('ui')
      .select('COUNT(*)', 'value')
      .where('ui.type = :type', { type })
      .andWhere('ui.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDateSql,
        endDate: endDateSql,
      })
      .getRawOne<{ value?: string }>();

    return Number.parseInt(rawRow?.value ?? '0', 10) || 0;
  }

  private async countInteractionsByTypes(
    types: string[],
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const normalizedTypes = types.map((value) => value.trim()).filter(Boolean);
    if (!normalizedTypes.length) return 0;

    if (startDate && endDate) {
      const { startDateSql, endDateSql } = this.toSqlDateRange(
        startDate,
        endDate,
      );

      const rawRow = await this.interactionRepository
        .createQueryBuilder('ui')
        .select('COUNT(*)', 'value')
        .where('ui.type IN (:...types)', {
          types: normalizedTypes,
        })
        .andWhere('ui.createdAt BETWEEN :startDate AND :endDate', {
          startDate: startDateSql,
          endDate: endDateSql,
        })
        .getRawOne<{ value?: string }>();

      return Number.parseInt(rawRow?.value ?? '0', 10) || 0;
    }

    return this.interactionRepository.count({
      where: { type: In(normalizedTypes) },
    });
  }

  private async countContactMessages(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const { startDateSql, endDateSql } = this.toSqlDateRange(startDate, endDate);

    const rawRow = await this.contactMessageRepository
      .createQueryBuilder('cm')
      .select('COUNT(*)', 'value')
      .where('cm.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDateSql,
        endDate: endDateSql,
      })
      .getRawOne<{ value?: string }>();

    return Number.parseInt(rawRow?.value ?? '0', 10) || 0;
  }

  private async countUniqueSessions(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const { startDateSql, endDateSql } = this.toSqlDateRange(startDate, endDate);

    const rawRows: unknown = await this.pageViewRepository.query(
      `
        SELECT COUNT(*)::int AS value
        FROM (
          SELECT pv."sessionId" AS "sessionId"
          FROM page_views pv
          WHERE pv."createdAt" BETWEEN $1 AND $2
            AND pv."sessionId" IS NOT NULL
            AND pv."path" NOT LIKE $3
          UNION
          SELECT ui."sessionId" AS "sessionId"
          FROM user_interactions ui
          WHERE ui."createdAt" BETWEEN $1 AND $2
            AND ui."sessionId" IS NOT NULL
        ) sessions
      `,
      [startDateSql, endDateSql, '/admin%'],
    );

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return 0;
    }

    const firstRow = rawRows[0] as { value?: unknown };
    const value = firstRow.value;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.trunc(value) : 0;
    }
    if (typeof value === 'string') {
      return Number.parseInt(value, 10) || 0;
    }
    return 0;
  }

  private async getDailyPageViews(startDate: Date, endDate: Date) {
    const offsetMinutes = this.getBusinessTimezoneOffsetMinutes();
    const { startDateSql, endDateSql } = this.toSqlDateRange(startDate, endDate);

    const rows = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select(
        "DATE(pv.createdAt - (:offsetMinutes * INTERVAL '1 minute'))",
        'date',
      )
      .addSelect('COUNT(*)', 'value')
      .where('pv.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDateSql,
        endDate: endDateSql,
      })
      .andWhere('pv.path NOT LIKE :adminPath', {
        adminPath: '/admin%',
      })
      .setParameter('offsetMinutes', offsetMinutes)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<RawCountRow>();

    return this.fillDailySeries(rows, startDate, endDate);
  }

  private async getDailyInteractions(startDate: Date, endDate: Date) {
    const offsetMinutes = this.getBusinessTimezoneOffsetMinutes();
    const { startDateSql, endDateSql } = this.toSqlDateRange(startDate, endDate);

    const rows = await this.interactionRepository
      .createQueryBuilder('ui')
      .select(
        "DATE(ui.createdAt - (:offsetMinutes * INTERVAL '1 minute'))",
        'date',
      )
      .addSelect('COUNT(*)', 'value')
      .where('ui.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDateSql,
        endDate: endDateSql,
      })
      .setParameter('offsetMinutes', offsetMinutes)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<RawCountRow>();

    return this.fillDailySeries(rows, startDate, endDate);
  }

  private fillDailySeries(rows: RawCountRow[], startDate: Date, endDate: Date) {
    const valuesByDay = new Map<string, number>();

    for (const row of rows) {
      valuesByDay.set(
        this.normalizeDateKey(row.date),
        Number.parseInt(row.value, 10) || 0,
      );
    }

    const startKey = this.formatDateInTimezone(
      startDate,
      StatsService.BUSINESS_TIMEZONE,
    );
    const endKey = this.formatDateInTimezone(
      endDate,
      StatsService.BUSINESS_TIMEZONE,
    );

    const series: Array<{ date: string; value: number }> = [];
    for (
      let cursorKey = startKey;
      cursorKey <= endKey;
      cursorKey = this.addDaysToDateKey(cursorKey, 1)
    ) {
      series.push({
        date: cursorKey,
        value: valuesByDay.get(cursorKey) ?? 0,
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

  private getBusinessTimezoneOffsetMinutes(): number {
    return StatsService.BUSINESS_TIMEZONE_OFFSET_MINUTES;
  }

  private async getTopPages(limit: number, startDate?: Date, endDate?: Date) {
    const query = this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.path', 'path')
      .addSelect('COUNT(*)', 'views')
      .where('pv.path NOT LIKE :adminPath', {
        adminPath: '/admin%',
      });

    if (startDate && endDate) {
      const { startDateSql, endDateSql } = this.toSqlDateRange(
        startDate,
        endDate,
      );
      query.andWhere('pv.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDateSql,
        endDate: endDateSql,
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
      const { startDateSql, endDateSql } = this.toSqlDateRange(
        startDate,
        endDate,
      );
      query.where('ui.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDateSql,
        endDate: endDateSql,
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
      .select('DATE(pv.createdAt)', 'date')
      .addSelect('COUNT(*)', 'views')
      .where('pv.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('pv.path NOT LIKE :adminPath', {
        adminPath: '/admin%',
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  private formatDateInTimezone(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (!year || !month || !day) {
      return this.normalizeDateKey(date.toISOString());
    }
    return `${year}-${month}-${day}`;
  }

  private addDaysToDateKey(dateKey: string, days: number): string {
    const [year, month, day] = dateKey
      .split('-')
      .map((part) => Number.parseInt(part, 10));
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + days);
    const nextYear = date.getUTCFullYear();
    const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const nextDay = String(date.getUTCDate()).padStart(2, '0');
    return `${nextYear}-${nextMonth}-${nextDay}`;
  }

  private buildDashboardCacheKey(range: DateRange): string {
    const payload = {
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      previousStartDate: range.previousStartDate.toISOString(),
      previousEndDate: range.previousEndDate.toISOString(),
      days: range.days,
    };
    return JSON.stringify(payload);
  }

  private getCachedDashboard(cacheKey: string): DashboardResponse | null {
    const cacheEntry = this.dashboardCache.get(cacheKey);
    if (!cacheEntry) return null;
    if (Date.now() > cacheEntry.expiresAt) {
      this.dashboardCache.delete(cacheKey);
      return null;
    }
    return cacheEntry.data;
  }

  private setCachedDashboard(
    cacheKey: string,
    payload: DashboardResponse,
  ): void {
    this.dashboardCache.set(cacheKey, {
      data: payload,
      expiresAt: Date.now() + StatsService.DASHBOARD_CACHE_TTL_MS,
    });

    if (this.dashboardCache.size <= StatsService.DASHBOARD_CACHE_MAX_ENTRIES) {
      return;
    }

    for (const [key, value] of this.dashboardCache) {
      if (value.expiresAt <= Date.now()) {
        this.dashboardCache.delete(key);
      }
    }

    while (
      this.dashboardCache.size > StatsService.DASHBOARD_CACHE_MAX_ENTRIES
    ) {
      const oldestKeyIterator = this.dashboardCache.keys().next();
      if (oldestKeyIterator.done) {
        break;
      }
      this.dashboardCache.delete(oldestKeyIterator.value);
    }
  }

  private invalidateDashboardCache(): void {
    this.dashboardCache.clear();
  }

  private toBusinessDateKey(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return this.formatDateInTimezone(
        new Date(),
        StatsService.BUSINESS_TIMEZONE,
      );
    }
    return this.formatDateInTimezone(parsed, StatsService.BUSINESS_TIMEZONE);
  }

  private businessDayStartToUtc(dateKey: string): Date {
    const [year, month, day] = this.parseDateKey(dateKey);
    const utcMs =
      Date.UTC(year, month - 1, day, 0, 0, 0, 0) +
      StatsService.BUSINESS_TIMEZONE_OFFSET_MINUTES * 60_000;
    return new Date(utcMs);
  }

  private businessDayEndToUtc(dateKey: string): Date {
    const nextDateKey = this.addDaysToDateKey(dateKey, 1);
    const nextDayStart = this.businessDayStartToUtc(nextDateKey);
    return new Date(nextDayStart.getTime() - 1);
  }

  private countDaysInclusiveByDateKey(
    startDateKey: string,
    endDateKey: string,
  ): number {
    const dayMs = 24 * 60 * 60 * 1000;
    const startUtcDate = this.dateKeyToUtcMidnight(startDateKey);
    const endUtcDate = this.dateKeyToUtcMidnight(endDateKey);
    return Math.max(
      1,
      Math.floor((endUtcDate.getTime() - startUtcDate.getTime()) / dayMs) + 1,
    );
  }

  private parseDateKey(dateKey: string): [number, number, number] {
    const [year, month, day] = dateKey
      .split('-')
      .map((part) => Number.parseInt(part, 10));
    return [year, month, day];
  }

  private dateKeyToUtcMidnight(dateKey: string): Date {
    const [year, month, day] = this.parseDateKey(dateKey);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private toSqlTimestamp(date: Date): string {
    return date.toISOString().replace('T', ' ').replace('Z', '');
  }

  private toSqlDateRange(startDate: Date, endDate: Date) {
    return {
      startDateSql: this.toSqlTimestamp(startDate),
      endDateSql: this.toSqlTimestamp(endDate),
    };
  }
}
