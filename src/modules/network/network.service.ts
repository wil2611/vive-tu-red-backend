import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { NetworkUser } from './entities/network-user.entity';
import { NetworkNode } from './entities/network-node.entity';
import { CreateNetworkDto } from './dto/create-network.dto';

@Injectable()
export class NetworkService {
  constructor(
    @InjectRepository(NetworkUser)
    private readonly networkUserRepository: Repository<NetworkUser>,
    @InjectRepository(NetworkNode)
    private readonly networkNodeRepository: Repository<NetworkNode>,
  ) {}

  async createNetwork(
    createNetworkDto: CreateNetworkDto,
  ): Promise<{ sessionId: string; networkUser: NetworkUser }> {
    const sessionId = randomUUID();

    const networkUser = this.networkUserRepository.create({
      sessionId,
    });
    const savedUser = await this.networkUserRepository.save(networkUser);

    const nodes = createNetworkDto.nodes.map((node) =>
      this.networkNodeRepository.create({
        ...node,
        networkUserId: savedUser.id,
      }),
    );

    await this.networkNodeRepository.save(nodes);

    const completeUser = await this.networkUserRepository.findOne({
      where: { id: savedUser.id },
      relations: ['nodes'],
    });

    return { sessionId, networkUser: completeUser! };
  }

  async findBySessionId(sessionId: string): Promise<NetworkUser> {
    const networkUser = await this.networkUserRepository.findOne({
      where: { sessionId },
      relations: ['nodes'],
    });
    if (!networkUser) {
      throw new NotFoundException('Red no encontrada');
    }
    return networkUser;
  }

  async findById(id: string): Promise<NetworkUser> {
    const networkUser = await this.networkUserRepository.findOne({
      where: { id },
      relations: ['nodes'],
    });
    if (!networkUser) {
      throw new NotFoundException('Red no encontrada');
    }
    return networkUser;
  }
}
