import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  // ── Endpoints públicos ───────────────────────────────

  @Get()
  async findPublished() {
    return this.storiesService.findPublishedStories();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.storiesService.findStoryById(id);
  }

  @Get(':id/chapters')
  async findChapters(@Param('id') id: string) {
    return this.storiesService.findChaptersByStory(id);
  }

  @Get('chapters/:id')
  async findChapter(@Param('id') id: string) {
    return this.storiesService.findChapterById(id);
  }

  // ── Endpoints protegidos (admin/editor) ──────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async create(@Body() createStoryDto: CreateStoryDto) {
    return this.storiesService.createStory(createStoryDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id') id: string,
    @Body() updateStoryDto: UpdateStoryDto,
  ) {
    return this.storiesService.updateStory(id, updateStoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: string) {
    return this.storiesService.removeStory(id);
  }

  // ── Chapters protegidos ──────────────────────────────

  @Post('chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async createChapter(@Body() createChapterDto: CreateChapterDto) {
    return this.storiesService.createChapter(createChapterDto);
  }

  @Put('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async updateChapter(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    return this.storiesService.updateChapter(id, updateChapterDto);
  }

  @Delete('chapters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async removeChapter(@Param('id') id: string) {
    return this.storiesService.removeChapter(id);
  }
}
