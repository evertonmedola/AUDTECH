import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Criticidade } from '../common/enums/criticidade.enum';
import { StatusNaoConformidade } from '../common/enums/status.enum';
import { ItemExecucao } from './item-execucao.entity';
import { AcaoCorretiva } from '../plano-acao/acao-corretiva.entity';

@Entity('nao_conformidades')
export class NaoConformidade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ length: 200, nullable: true })
  normaReferencia: string;

  @Column({ length: 200, nullable: true })
  localProcesso: string;

  @Column({ type: 'varchar' })
  criticidade: Criticidade;

  @Column({ type: 'varchar', default: StatusNaoConformidade.ABERTA })
  status: StatusNaoConformidade;

  @ManyToOne(() => ItemExecucao, (item) => item.naoConformidades, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'item_execucao_id' })
  itemExecucao: ItemExecucao;

  @Column({ name: 'item_execucao_id' })
  itemExecucaoId: number;

  @OneToMany(() => AcaoCorretiva, (acao) => acao.naoConformidade, {
    cascade: true,
  })
  acoesCorretivas: AcaoCorretiva[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
