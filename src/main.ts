import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

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
    .map((origin) => origin.trim())
    .filter(Boolean);

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  const localOrigins = isProduction
    ? []
    : ['http://localhost:3000', 'http://localhost:3001'];

  const frontendOrigins = new Set<string>([
    ...localOrigins,
    ...configuredOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow same-origin or non-browser clients (no Origin header).
      if (!origin || frontendOrigins.has(origin)) {
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
