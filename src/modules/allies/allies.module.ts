import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlliesService } from './allies.service';
import { AlliesController } from './allies.controller';
import { ProjectAlly } from './entities/project-ally.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectAlly])],
  controllers: [AlliesController],
  providers: [AlliesService],
  exports: [AlliesService],
})
export class AlliesModule {}
