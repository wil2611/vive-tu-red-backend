import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
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

  private normalizeOptionalText(value?: unknown): string | null {
    if (value === undefined || value === null) return null;

    if (typeof value !== 'string') {
      throw new BadRequestException('El valor enviado debe ser texto valido');
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  async create(createTeamMemberDto: CreateTeamMemberDto): Promise<TeamMember> {
    const teamMember = this.teamMemberRepository.create({
      name: this.normalizeRequiredText(createTeamMemberDto.name, 'El nombre'),
      profile: this.normalizeRequiredText(
        createTeamMemberDto.profile,
        'El perfil',
      ),
      department: this.normalizeOptionalText(createTeamMemberDto.department),
      division: this.normalizeOptionalText(createTeamMemberDto.division),
      photo: this.normalizeOptionalText(createTeamMemberDto.photo),
      isActive: createTeamMemberDto.isActive ?? true,
    });

    return this.teamMemberRepository.save(teamMember);
  }

  async findAll(): Promise<TeamMember[]> {
    return this.teamMemberRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findActive(): Promise<TeamMember[]> {
    return this.teamMemberRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<TeamMember> {
    const teamMember = await this.teamMemberRepository.findOne({
      where: { id },
    });
    if (!teamMember) {
      throw new NotFoundException('Integrante no encontrado');
    }
    return teamMember;
  }

  async findActiveById(id: string): Promise<TeamMember> {
    const teamMember = await this.teamMemberRepository.findOne({
      where: { id, isActive: true },
    });
    if (!teamMember) {
      throw new NotFoundException('Integrante no encontrado');
    }
    return teamMember;
  }

  async update(
    id: string,
    updateTeamMemberDto: UpdateTeamMemberDto,
  ): Promise<TeamMember> {
    const teamMember = await this.findById(id);

    if (updateTeamMemberDto.name !== undefined) {
      teamMember.name = this.normalizeRequiredText(
        updateTeamMemberDto.name,
        'El nombre',
      );
    }

    if (updateTeamMemberDto.profile !== undefined) {
      teamMember.profile = this.normalizeRequiredText(
        updateTeamMemberDto.profile,
        'El perfil',
      );
    }

    if (updateTeamMemberDto.department !== undefined) {
      teamMember.department = this.normalizeOptionalText(
        updateTeamMemberDto.department,
      );
    }

    if (updateTeamMemberDto.division !== undefined) {
      teamMember.division = this.normalizeOptionalText(
        updateTeamMemberDto.division,
      );
    }

    if (updateTeamMemberDto.photo !== undefined) {
      teamMember.photo = this.normalizeOptionalText(updateTeamMemberDto.photo);
    }

    if (updateTeamMemberDto.isActive !== undefined) {
      teamMember.isActive = updateTeamMemberDto.isActive;
    }

    return this.teamMemberRepository.save(teamMember);
  }

  async remove(id: string): Promise<{ message: string }> {
    const teamMember = await this.findById(id);
    await this.teamMemberRepository.remove(teamMember);
    return { message: 'Integrante eliminado exitosamente' };
  }
}
