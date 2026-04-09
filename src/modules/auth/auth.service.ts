import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
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

  async refreshTokens(refreshToken: string) {
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

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Sesión cerrada exitosamente' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessTokenExpiration = parseInt(
      this.configService.get<string>('JWT_EXPIRATION', '3600'),
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
          ? 3600
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
