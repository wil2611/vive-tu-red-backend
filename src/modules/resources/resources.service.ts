import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { normalizeResourceCategory } from './resource-categories';
import { UserInteraction } from '../stats/entities/user-interaction.entity';
import { InteractionType } from '../stats/dto/create-interaction.dto';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    private readonly dataSource: DataSource,
    private readonly statsService: StatsService,
  ) {}

  private ensurePublishable(input: {
    isPublished?: boolean;
    fileUrl?: string | null;
  }): void {
    if (input.isPublished !== true) return;
    if (input.fileUrl && input.fileUrl.trim().length > 0) return;

    throw new BadRequestException(
      'Un recurso publicado debe tener fileUrl para apertura.',
    );
  }

  async create(createResourceDto: CreateResourceDto): Promise<Resource> {
    this.ensurePublishable({
      isPublished: createResourceDto.isPublished ?? true,
      fileUrl: createResourceDto.fileUrl ?? null,
    });

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

  async findPublishedById(id: string): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({
      where: { id, isPublished: true },
    });
    if (!resource) {
      throw new NotFoundException('Recurso no encontrado');
    }
    return resource;
  }

  async findByCategory(category: string): Promise<Resource[]> {
    const normalizedCategory = normalizeResourceCategory(category);
    if (!normalizedCategory) {
      throw new BadRequestException(
        'Categoria invalida. Usa: prevencion, orientacion o formacion.',
      );
    }

    return this.resourceRepository.find({
      where: { category: normalizedCategory, isPublished: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateResourceDto: UpdateResourceDto,
  ): Promise<Resource> {
    const resource = await this.findById(id);

    this.ensurePublishable({
      isPublished: updateResourceDto.isPublished ?? resource.isPublished,
      fileUrl: updateResourceDto.fileUrl ?? resource.fileUrl,
    });

    Object.assign(resource, updateResourceDto);
    return this.resourceRepository.save(resource);
  }

  async remove(id: string): Promise<{ message: string }> {
    const resource = await this.findById(id);
    await this.resourceRepository.remove(resource);
    return { message: 'Recurso eliminado exitosamente' };
  }

  async incrementOpenCount(id: string): Promise<void> {
    const result = await this.resourceRepository.increment(
      { id, isPublished: true },
      'openCount',
      1,
    );
    if (!result.affected) {
      throw new NotFoundException('Recurso no encontrado');
    }
  }

  async trackOpenWithInteraction(
    id: string,
    interactionType: InteractionType,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const resourceRepo = manager.getRepository(Resource);
      const interactionRepo = manager.getRepository(UserInteraction);

      const result = await resourceRepo.increment(
        { id, isPublished: true },
        'openCount',
        1,
      );

      if (!result.affected) {
        throw new NotFoundException('Recurso no encontrado');
      }

      const interaction = interactionRepo.create({
        type: interactionType,
        targetType: 'resource',
        targetId: id,
      });

      await interactionRepo.save(interaction);
    });

    this.statsService.invalidateDashboardCachePublic();
  }
}
