import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportPath } from './entities/support-path.entity';
import { CreateSupportPathDto } from './dto/create-support-path.dto';
import { UpdateSupportPathDto } from './dto/update-support-path.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportPath)
    private readonly supportPathRepository: Repository<SupportPath>,
  ) {}

  private normalizeRequiredText(value: string, fieldName: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldName} no puede estar vacio`);
    }
    return normalized;
  }

  private normalizeOptionalText(value?: string): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  async create(
    createSupportPathDto: CreateSupportPathDto,
  ): Promise<SupportPath> {
    const supportPath = this.supportPathRepository.create({
      institutionName: this.normalizeRequiredText(
        createSupportPathDto.institutionName,
        'El nombre de la institucion',
      ),
      description: this.normalizeOptionalText(createSupportPathDto.description),
      phone: this.normalizeOptionalText(createSupportPathDto.phone),
      email: this.normalizeOptionalText(createSupportPathDto.email),
      ubicacion: this.normalizeOptionalText(createSupportPathDto.ubicacion),
      schedule: this.normalizeOptionalText(createSupportPathDto.schedule),
      isActive: createSupportPathDto.isActive ?? true,
    });
    return this.supportPathRepository.save(supportPath);
  }

  async findAll(): Promise<SupportPath[]> {
    return this.supportPathRepository.find({
      order: { institutionName: 'ASC' },
    });
  }

  async findActive(): Promise<SupportPath[]> {
    return this.supportPathRepository.find({
      where: { isActive: true },
      order: { institutionName: 'ASC' },
    });
  }

  async findById(id: string): Promise<SupportPath> {
    const supportPath = await this.supportPathRepository.findOne({
      where: { id },
    });
    if (!supportPath) {
      throw new NotFoundException('Ruta de atencion no encontrada');
    }
    return supportPath;
  }

  async findActiveById(id: string): Promise<SupportPath> {
    const supportPath = await this.supportPathRepository.findOne({
      where: { id, isActive: true },
    });
    if (!supportPath) {
      throw new NotFoundException('Ruta de atencion no encontrada');
    }
    return supportPath;
  }

  async update(
    id: string,
    updateSupportPathDto: UpdateSupportPathDto,
  ): Promise<SupportPath> {
    const supportPath = await this.findById(id);

    if (updateSupportPathDto.institutionName !== undefined) {
      supportPath.institutionName = this.normalizeRequiredText(
        updateSupportPathDto.institutionName,
        'El nombre de la institucion',
      );
    }

    if (updateSupportPathDto.description !== undefined) {
      supportPath.description = this.normalizeOptionalText(
        updateSupportPathDto.description,
      );
    }

    if (updateSupportPathDto.phone !== undefined) {
      supportPath.phone = this.normalizeOptionalText(
        updateSupportPathDto.phone,
      );
    }

    if (updateSupportPathDto.email !== undefined) {
      supportPath.email = this.normalizeOptionalText(
        updateSupportPathDto.email,
      );
    }

    if (updateSupportPathDto.ubicacion !== undefined) {
      supportPath.ubicacion = this.normalizeOptionalText(
        updateSupportPathDto.ubicacion,
      );
    }

    if (updateSupportPathDto.schedule !== undefined) {
      supportPath.schedule = this.normalizeOptionalText(
        updateSupportPathDto.schedule,
      );
    }

    if (updateSupportPathDto.isActive !== undefined) {
      supportPath.isActive = updateSupportPathDto.isActive;
    }

    return this.supportPathRepository.save(supportPath);
  }

  async remove(id: string): Promise<{ message: string }> {
    const supportPath = await this.findById(id);
    await this.supportPathRepository.remove(supportPath);
    return { message: 'Ruta de atencion eliminada exitosamente' };
  }
}
