import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbPort = parseInt(
          configService.get<string>('DB_PORT', '5432'),
          10,
        );
        const caPath = configService.get<string>('DB_SSL_CA');
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: Number.isNaN(dbPort) ? 5432 : dbPort,
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'vive_tu_red'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          ssl: caPath
            ? { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true }
            : undefined,
          synchronize:
            !isProduction &&
            configService.get<string>('DB_SYNCHRONIZE') !== 'false',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
