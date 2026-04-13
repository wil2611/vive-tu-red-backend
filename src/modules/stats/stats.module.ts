import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { PageView } from './entities/page-view.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { ContactMessage } from '../contact/entities/contact-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PageView, UserInteraction, ContactMessage]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
