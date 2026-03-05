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
import { SupportService } from './support.service';
import { CreateSupportPathDto } from './dto/create-support-path.dto';
import { UpdateSupportPathDto } from './dto/update-support-path.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ── Endpoints públicos ───────────────────────────────

  @Get()
  async findActive() {
    return this.supportService.findActive();
  }

  @Get('emergency')
  async findEmergency() {
    return this.supportService.findEmergency();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.supportService.findActiveById(id);
  }

  // ── Endpoints protegidos ─────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async create(@Body() createSupportPathDto: CreateSupportPathDto) {
    return this.supportService.create(createSupportPathDto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findAll() {
    return this.supportService.findAll();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id') id: string,
    @Body() updateSupportPathDto: UpdateSupportPathDto,
  ) {
    return this.supportService.update(id, updateSupportPathDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: string) {
    return this.supportService.remove(id);
  }
}
