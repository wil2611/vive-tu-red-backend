import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectAlly } from './entities/project-ally.entity';
import { CreateProjectAllyDto } from './dto/create-project-ally.dto';
import { UpdateProjectAllyDto } from './dto/update-project-ally.dto';

@Injectable()
export class AlliesService {
  constructor(
    @InjectRepository(ProjectAlly)
    private readonly projectAllyRepository: Repository<ProjectAlly>,
  ) {}

  private normalizeRequiredText(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} debe ser texto valido`);
    }

    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldName} no puede estar vacio`);
    }
    return normalized;
  }

  async create(createProjectAllyDto: CreateProjectAllyDto): Promise<ProjectAlly> {
    const projectAlly = this.projectAllyRepository.create({
      institutionName: this.normalizeRequiredText(
        createProjectAllyDto.institutionName,
        'El nombre de la institucion',
      ),
      roleLabel: this.normalizeRequiredText(
        createProjectAllyDto.roleLabel,
        'El rol visible',
      ),
      type: createProjectAllyDto.type,
      summary: this.normalizeRequiredText(
        createProjectAllyDto.summary,
        'El resumen',
      ),
      participationScope: this.normalizeRequiredText(
        createProjectAllyDto.participationScope,
        'El alcance de participacion',
      ),
      isActive: createProjectAllyDto.isActive ?? true,
    });

    return this.projectAllyRepository.save(projectAlly);
  }

  async findAll(): Promise<ProjectAlly[]> {
    return this.projectAllyRepository.find({
      order: { institutionName: 'ASC' },
    });
  }

  async findActive(): Promise<ProjectAlly[]> {
    return this.projectAllyRepository.find({
      where: { isActive: true },
      order: { institutionName: 'ASC' },
    });
  }

  async findById(id: string): Promise<ProjectAlly> {
    const projectAlly = await this.projectAllyRepository.findOne({
      where: { id },
    });
    if (!projectAlly) {
      throw new NotFoundException('Aliado o participante no encontrado');
    }
    return projectAlly;
  }

  async update(
    id: string,
    updateProjectAllyDto: UpdateProjectAllyDto,
  ): Promise<ProjectAlly> {
    const projectAlly = await this.findById(id);

    if (updateProjectAllyDto.institutionName !== undefined) {
      projectAlly.institutionName = this.normalizeRequiredText(
        updateProjectAllyDto.institutionName,
        'El nombre de la institucion',
      );
    }

    if (updateProjectAllyDto.roleLabel !== undefined) {
      projectAlly.roleLabel = this.normalizeRequiredText(
        updateProjectAllyDto.roleLabel,
        'El rol visible',
      );
    }

    if (updateProjectAllyDto.type !== undefined) {
      projectAlly.type = updateProjectAllyDto.type;
    }

    if (updateProjectAllyDto.summary !== undefined) {
      projectAlly.summary = this.normalizeRequiredText(
        updateProjectAllyDto.summary,
        'El resumen',
      );
    }

    if (updateProjectAllyDto.participationScope !== undefined) {
      projectAlly.participationScope = this.normalizeRequiredText(
        updateProjectAllyDto.participationScope,
        'El alcance de participacion',
      );
    }

    if (updateProjectAllyDto.isActive !== undefined) {
      projectAlly.isActive = updateProjectAllyDto.isActive;
    }

    return this.projectAllyRepository.save(projectAlly);
  }

  async remove(id: string): Promise<{ message: string }> {
    const projectAlly = await this.findById(id);
    await this.projectAllyRepository.remove(projectAlly);
    return { message: 'Aliado o participante eliminado exitosamente' };
  }
}
