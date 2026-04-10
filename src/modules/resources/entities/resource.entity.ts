import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  type: string | null; // 'pdf' | 'infografia' | 'guia' | 'cartilla'

  @Column({ type: 'text', nullable: true })
  fileUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column('simple-array', { nullable: true })
  tags: string[] | null;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ default: 0 })
  openCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
