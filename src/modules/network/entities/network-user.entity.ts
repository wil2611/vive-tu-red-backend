import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { NetworkNode } from './network-node.entity';

@Entity('network_users')
export class NetworkUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionId: string; // Identificador anónimo de sesión

  @OneToMany(() => NetworkNode, (node) => node.networkUser, { cascade: true })
  nodes: NetworkNode[];

  @CreateDateColumn()
  createdAt: Date;
}
