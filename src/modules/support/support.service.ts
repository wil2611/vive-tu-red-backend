import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(
    createSupportPathDto: CreateSupportPathDto,
  ): Promise<SupportPath> {
    const supportPath =
      this.supportPathRepository.create(createSupportPathDto);
    return this.supportPathRepository.save(supportPath);
  }

  async findAll(): Promise<SupportPath[]> {
    return this.supportPathRepository.find({
      order: { order: 'ASC', institutionName: 'ASC' },
    });
  }

  async findActive(): Promise<SupportPath[]> {
    return this.supportPathRepository.find({
      where: { isActive: true },
      order: { order: 'ASC', institutionName: 'ASC' },
    });
  }

  async findEmergency(): Promise<SupportPath[]> {
    return this.supportPathRepository.find({
      where: { isActive: true, isEmergency: true },
      order: { order: 'ASC' },
    });
  }

  async findById(id: string): Promise<SupportPath> {
    const supportPath = await this.supportPathRepository.findOne({
      where: { id },
    });
    if (!supportPath) {
      throw new NotFoundException('Ruta de atención no encontrada');
    }
    return supportPath;
  }

  async update(
    id: string,
    updateSupportPathDto: UpdateSupportPathDto,
  ): Promise<SupportPath> {
    const supportPath = await this.findById(id);
    Object.assign(supportPath, updateSupportPathDto);
    return this.supportPathRepository.save(supportPath);
  }

  async remove(id: string): Promise<{ message: string }> {
    const supportPath = await this.findById(id);
    await this.supportPathRepository.remove(supportPath);
    return { message: 'Ruta de atención eliminada exitosamente' };
  }
}
