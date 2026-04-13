import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Seguridad - Helmet
  app.use(helmet());

  // CORS restrictivo
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

  const frontendOrigins = new Set<string>([
    ...localOrigins,
    ...configuredOrigins,
  ]);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Allow same-origin or non-browser clients (no Origin header).
      if (!origin || frontendOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Prefijo global de API
  app.setGlobalPrefix('api');

  // Validacion global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = parseInt(configService.get<string>('PORT', '3000'), 10);
  const safePort = Number.isNaN(port) ? 3000 : port;
  await app.listen(safePort);
  console.log(`Servidor corriendo en http://localhost:${safePort}/api`);
}
void bootstrap();
