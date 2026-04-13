import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ContactMessageStatus {
  NEW = 'new',
  READ = 'read',
  IN_PROGRESS = 'in_progress',
  RESPONDED = 'responded',
}

@Entity('contact_messages')
@Index('IDX_contact_messages_created_at', ['createdAt'])
@Index('IDX_contact_messages_status_created_at', ['status', 'createdAt'])
@Index('IDX_contact_messages_email', ['email'])
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 180 })
  email: string;

  @Column({ length: 120 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: ContactMessageStatus,
    default: ContactMessageStatus.NEW,
  })
  status: ContactMessageStatus;

  @Column({ nullable: true })
  ip: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
