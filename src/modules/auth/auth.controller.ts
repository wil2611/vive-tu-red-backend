import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { REFRESH_TOKEN_COOKIE_NAME, readCookieValue } from './auth-cookie.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      ttl: 60_000,
      limit: 6,
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.authService.setAuthCookies(response, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return {
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      ttl: 60_000,
      limit: 20,
    },
  })
  async refresh(
    @Req() req: Request,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshTokenFromCookie = readCookieValue(
      req.headers.cookie,
      REFRESH_TOKEN_COOKIE_NAME,
    );

    const result = await this.authService.refreshTokens(
      refreshTokenFromCookie || refreshTokenDto?.refreshToken || null,
    );

    this.authService.setAuthCookies(response, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return {
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      ttl: 60_000,
      limit: 30,
    },
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = req.user as { id: string };
    return this.authService.logout(user.id, response);
  }
}
