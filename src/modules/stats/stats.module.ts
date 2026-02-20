import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { PageView } from './entities/page-view.entity';
import { UserInteraction } from './entities/user-interaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PageView, UserInteraction])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
