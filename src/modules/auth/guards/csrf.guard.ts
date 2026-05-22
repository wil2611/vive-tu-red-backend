import {
  ForbiddenException,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import {
  CSRF_TOKEN_COOKIE_NAME,
  CSRF_TOKEN_HEADER_NAME,
  readCookieValue,
} from '../auth-cookie.util';

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim();
  if (!trimmed) return '';

  try {
    const parsedUrl = new URL(trimmed);
    return `${parsedUrl.protocol}//${parsedUrl.host}`;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

function parseBooleanFlag(
  value: string | undefined,
  fallback = false,
): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(configService: ConfigService) {
    const configuredOrigins = (
      configService.get<string>('FRONTEND_URL', '') ?? ''
    )
      .split(',')
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean);

    const allowLocalhostOrigins = parseBooleanFlag(
      configService.get<string>('ALLOW_LOCALHOST_ORIGINS'),
      true,
    );

    const localOrigins = allowLocalhostOrigins
      ? [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ]
      : [];

    this.allowedOrigins = new Set([...localOrigins, ...configuredOrigins]);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    this.assertAllowedOrigin(request);

    const cookieToken = readCookieValue(
      request.headers.cookie,
      CSRF_TOKEN_COOKIE_NAME,
    );
    const headerToken = this.readHeaderToken(request);

    if (
      !cookieToken ||
      !headerToken ||
      !this.tokensMatch(cookieToken, headerToken)
    ) {
      throw new ForbiddenException('Token CSRF invalido');
    }

    return true;
  }

  private assertAllowedOrigin(request: Request): void {
    const origin = request.headers.origin;
    if (!origin) return;

    if (!this.allowedOrigins.has(normalizeOrigin(origin))) {
      throw new ForbiddenException('Origen no permitido');
    }
  }

  private readHeaderToken(request: Request): string | null {
    const value = request.headers[CSRF_TOKEN_HEADER_NAME];
    if (Array.isArray(value)) return value[0] ?? null;
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private tokensMatch(cookieToken: string, headerToken: string): boolean {
    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);

    if (cookieBuffer.length !== headerBuffer.length) {
      return false;
    }

    return timingSafeEqual(cookieBuffer, headerBuffer);
  }
}
