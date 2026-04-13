import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import {
  clearAccessTokenRevocation,
  revokeAccessTokensForUser,
} from '../../common/security/access-token-revocation';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from './auth-cookie.util';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthLoginResult = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
} & AuthTokens;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieBaseOptions(maxAgeMs: number) {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';
    const sameSite = isProduction ? ('none' as const) : ('lax' as const);

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  setAuthCookies(response: Response, tokens: AuthTokens): void {
    const accessTokenExpiration = parseInt(
      this.configService.get<string>('JWT_EXPIRATION', '3600'),
      10,
    );
    const refreshTokenExpiration = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION', '604800'),
      10,
    );

    const safeAccessTtlSeconds = Number.isNaN(accessTokenExpiration)
      ? 900
      : accessTokenExpiration;
    const safeRefreshTtlSeconds = Number.isNaN(refreshTokenExpiration)
      ? 604800
      : refreshTokenExpiration;

    response.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      tokens.accessToken,
      this.getCookieBaseOptions(safeAccessTtlSeconds * 1000),
    );

    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      tokens.refreshToken,
      this.getCookieBaseOptions(safeRefreshTtlSeconds * 1000),
    );
  }

  clearAuthCookies(response: Response): void {
    const options = this.getCookieBaseOptions(0);
    response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, options);
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, options);
  }

  async login(loginDto: LoginDto): Promise<AuthLoginResult> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Usuario desactivado');
    }

    clearAccessTokenRevocation(user.id);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string | null): Promise<AuthLoginResult> {
    if (!refreshToken) {
      throw new ForbiddenException('Acceso denegado');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.refreshToken || !user.isActive) {
        throw new ForbiddenException('Acceso denegado');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshTokenValid) {
        throw new ForbiddenException('Acceso denegado');
      }

      clearAccessTokenRevocation(user.id);

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        ...tokens,
      };
    } catch {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async logout(userId: string, response: Response) {
    await this.usersService.updateRefreshToken(userId, null);
    revokeAccessTokensForUser(userId);
    this.clearAuthCookies(response);
    return { message: 'Sesión cerrada exitosamente' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessTokenExpiration = parseInt(
      this.configService.get<string>('JWT_EXPIRATION', '900'),
      10,
    );
    const refreshTokenExpiration = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION', '604800'),
      10,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: Number.isNaN(accessTokenExpiration)
          ? 900
          : accessTokenExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number.isNaN(refreshTokenExpiration)
          ? 604800
          : refreshTokenExpiration,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
