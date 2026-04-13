import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkService } from './network.service';
import { NetworkController } from './network.controller';
import { NetworkUser } from './entities/network-user.entity';
import { NetworkNode } from './entities/network-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NetworkUser, NetworkNode])],
  controllers: [NetworkController],
  providers: [NetworkService],
  exports: [NetworkService],
})
export class NetworkModule {}
