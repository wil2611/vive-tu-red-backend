import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { NetworkService } from './network.service';
import { CreateNetworkDto } from './dto/create-network.dto';

@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Post()
  async create(@Body() createNetworkDto: CreateNetworkDto) {
    return this.networkService.createNetwork(createNetworkDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.networkService.findById(id);
  }

  @Get('session/:sessionId')
  async findBySession(@Param('sessionId') sessionId: string) {
    return this.networkService.findBySessionId(sessionId);
  }
}
