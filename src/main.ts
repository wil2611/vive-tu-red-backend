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
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3001'),
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
