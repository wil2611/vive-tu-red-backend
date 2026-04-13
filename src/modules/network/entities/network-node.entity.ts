import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NetworkUser } from './network-user.entity';

@Entity('network_nodes')
export class NetworkNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string; // Etiqueta del nodo (ej: "Familia", "Amigos", etc.)

  @Column()
  category: string; // Categoría del nodo

  @Column({ type: 'int', default: 1 })
  strength: number; // Fuerza de la relación (1-5)

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Datos adicionales para la visualización

  @ManyToOne(() => NetworkUser, (user) => user.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'networkUserId' })
  networkUser: NetworkUser;

  @Column()
  networkUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}
