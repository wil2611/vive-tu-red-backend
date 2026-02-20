import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('support_paths')
export class SupportPath {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institutionName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  department: string;

  @Column({ default: false })
  isEmergency: boolean;

  @Column({ type: 'text', nullable: true })
  attentionProcess: string;

  @Column({ nullable: true })
  schedule: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
