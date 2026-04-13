import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ContactService } from './contact.service';
import {
  CreateContactMessageDto,
  ListAdminContactMessagesDto,
  UpdateContactMessageStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { Throttle } from '@nestjs/throttler';

type AuthenticatedRequest = Request & {
  user: { id: string; email: string; role: UserRole };
};

@Controller(['contact', 'contacto'])
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  private canSeeSensitiveMetadata(req: AuthenticatedRequest): boolean {
    return req.user.role === UserRole.ADMIN;
  }

  @Post()
  @Throttle({
    default: {
      ttl: 60_000,
      limit: 8,
    },
  })
  async create(
    @Body() createContactMessageDto: CreateContactMessageDto,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
  ) {
    return this.contactService.create(createContactMessageDto, {
      ip: req.ip,
      userAgent,
    });
  }

  @Get('admin/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.INVESTIGADOR)
  async listAdminMessages(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListAdminContactMessagesDto,
  ) {
    return this.contactService.listAdminMessages(
      query,
      this.canSeeSensitiveMetadata(req),
    );
  }

  @Patch('admin/:id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.INVESTIGADOR)
  async markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.contactService.markAsRead(
      id,
      this.canSeeSensitiveMetadata(req),
    );
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.INVESTIGADOR)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateContactMessageStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.contactService.updateStatus(
      id,
      updateStatusDto.status,
      this.canSeeSensitiveMetadata(req),
    );
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.contactService.remove(id);
  }
}
