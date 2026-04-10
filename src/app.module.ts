import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoriesModule } from './modules/stories/stories.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { SupportModule } from './modules/support/support.module';
import { NetworkModule } from './modules/network/network.module';
import { StatsModule } from './modules/stats/stats.module';
import { ContactModule } from './modules/contact/contact.module';
import { TeamModule } from './modules/team/team.module';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),

    // Base de datos
    DatabaseModule,

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    StoriesModule,
    ResourcesModule,
    SupportModule,
    TeamModule,
    NetworkModule,
    StatsModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
