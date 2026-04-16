import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  CategoriaPendencia,
} from '../common/enums/resultado-item.enum';
import { CriticidadeAmbiental } from '../common/enums/criticidade.enum';
import { ItemExecucao } from './item-execucao.entity';

@Entity('pendencias')
export class Pendencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  categoria: CategoriaPendencia;

  @Column({ type: 'text' })
  descricao: string;

  // Referência normativa — obrigatória para pendências documentais
  @Column({ type: 'text', nullable: true })
  referenciaNormativa: string;

  // Criticidade — obrigatória apenas para pendências ambientais
  @Column({ type: 'varchar', nullable: true })
  criticidade: CriticidadeAmbiental;

  // Documento substituto ou comprovante de regularização
  @Column({ nullable: true })
  anexoUrl: string;

  @ManyToOne(() => ItemExecucao, (item) => item.pendencias, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'item_execucao_id' })
  itemExecucao: ItemExecucao;

  @Column({ name: 'item_execucao_id' })
  itemExecucaoId: number;
  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
