import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { CreatePageViewDto } from './dto/create-page-view.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { GetDashboardStatsDto } from './dto/get-dashboard-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import type { Request } from 'express';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // ── Endpoints públicos (tracking) ────────────────────

  @Post('page-view')
  async trackPageView(
    @Body() createPageViewDto: CreatePageViewDto,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    return this.statsService.trackPageView(createPageViewDto, userAgent, ip);
  }

  @Post('interaction')
  async trackInteraction(@Body() createInteractionDto: CreateInteractionDto) {
    return this.statsService.trackInteraction(createInteractionDto);
  }

  // ── Endpoints protegidos (dashboard) ─────────────────

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.INVESTIGADOR)
  async getOverview() {
    return this.statsService.getOverview();
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.INVESTIGADOR)
  async getDashboard(@Query() query: GetDashboardStatsDto) {
    return this.statsService.getDashboard(query);
  }
}
