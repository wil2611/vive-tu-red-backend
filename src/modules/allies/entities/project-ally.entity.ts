import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectAllyType } from '../allies.types';

@Entity('project_allies')
export class ProjectAlly {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  institutionName: string;

  @Column({ type: 'varchar', length: 120 })
  roleLabel: string;

  @Column({
    type: 'enum',
    enum: ProjectAllyType,
    enumName: 'project_allies_type_enum',
    default: ProjectAllyType.ALLY,
  })
  type: ProjectAllyType;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  participationScope: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
