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
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

type AuthenticatedRequest = Request & {
  user: { id: string; email: string; role: UserRole };
};

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('roles')
  @Roles(UserRole.ADMIN)
  getRoles() {
    return Object.values(UserRole).map((role) => ({ role }));
  }

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findSafeById(req.user.id);
  }

  @Put('me')
  async updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateMyProfileDto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMyProfile(req.user.id, updateMyProfileDto);
  }

  @Patch('me/change-password')
  async changeMyPassword(
    @Req() req: AuthenticatedRequest,
    @Body() changeMyPasswordDto: ChangeMyPasswordDto,
  ) {
    return this.usersService.changeMyPassword(
      req.user.id,
      changeMyPasswordDto.currentPassword,
      changeMyPasswordDto.newPassword,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findSafeById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN)
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, resetPasswordDto.password);
  }
}
