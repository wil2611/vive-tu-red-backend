import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { InteractionType } from '../stats/dto/create-interaction.dto';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  // ── Endpoints públicos ───────────────────────────────

  @Get()
  async findPublished(@Query('category') category?: string) {
    if (category) {
      return this.resourcesService.findByCategory(category);
    }
    return this.resourcesService.findPublished();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.resourcesService.findPublishedById(id);
  }

  @Patch(':id/open')
  async trackOpen(@Param('id') id: string) {
    await this.resourcesService.trackOpenWithInteraction(
      id,
      InteractionType.RESOURCE_OPEN,
    );
    return { message: 'Apertura registrada' };
  }

  @Patch(':id/download')
  async trackDownloadLegacy(@Param('id') id: string) {
    await this.resourcesService.trackOpenWithInteraction(
      id,
      InteractionType.RESOURCE_DOWNLOAD,
    );
    return { message: 'Apertura registrada' };
  }

  // ── Endpoints protegidos ─────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.create(createResourceDto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findAll() {
    return this.resourcesService.findAll();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: string) {
    return this.resourcesService.remove(id);
  }
}
