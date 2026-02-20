import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
  ) {}

  async create(createResourceDto: CreateResourceDto): Promise<Resource> {
    const resource = this.resourceRepository.create(createResourceDto);
    return this.resourceRepository.save(resource);
  }

  async findAll(): Promise<Resource[]> {
    return this.resourceRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findPublished(): Promise<Resource[]> {
    return this.resourceRepository.find({
      where: { isPublished: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({ where: { id } });
    if (!resource) {
      throw new NotFoundException('Recurso no encontrado');
    }
    return resource;
  }

  async findByCategory(category: string): Promise<Resource[]> {
    return this.resourceRepository.find({
      where: { category, isPublished: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateResourceDto: UpdateResourceDto,
  ): Promise<Resource> {
    const resource = await this.findById(id);
    Object.assign(resource, updateResourceDto);
    return this.resourceRepository.save(resource);
  }

  async remove(id: string): Promise<{ message: string }> {
    const resource = await this.findById(id);
    await this.resourceRepository.remove(resource);
    return { message: 'Recurso eliminado exitosamente' };
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await this.resourceRepository.increment({ id }, 'downloadCount', 1);
  }
}
