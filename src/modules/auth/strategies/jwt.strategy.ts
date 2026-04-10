import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  readCookieValue,
} from '../auth-cookie.util';
import { isAccessTokenRevoked } from '../../../common/security/access-token-revocation';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: { headers?: { cookie?: string } } | undefined) =>
          readCookieValue(req?.headers?.cookie, ACCESS_TOKEN_COOKIE_NAME),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    if (isAccessTokenRevoked(user.id, payload.iat)) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
