import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AlliesService } from './allies.service';
import { CreateProjectAllyDto } from './dto/create-project-ally.dto';
import { UpdateProjectAllyDto } from './dto/update-project-ally.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('allies')
export class AlliesController {
  constructor(private readonly alliesService: AlliesService) {}

  @Get()
  async findActive() {
    return this.alliesService.findActive();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async create(@Body() createProjectAllyDto: CreateProjectAllyDto) {
    return this.alliesService.create(createProjectAllyDto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findAll() {
    return this.alliesService.findAll();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectAllyDto: UpdateProjectAllyDto,
  ) {
    return this.alliesService.update(id, updateProjectAllyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.alliesService.remove(id);
  }
}
