import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusAcao } from '../common/enums/status.enum';
import { ChecklistExecucao } from '../checklist-execucao/checklist-execucao.entity';
import { AcaoCorretiva } from './acao-corretiva.entity';

@Entity('planos_acao')
export class PlanoAcao {
  @PrimaryGeneratedColumn()
  id: number;

  // Status calculado: CONCLUIDO apenas quando todas as ações são CONCLUIDO ou CANCELADO
  @Column({ type: 'varchar', default: StatusAcao.PENDENTE })
  status: StatusAcao;

  @OneToOne(() => ChecklistExecucao, (execucao) => execucao.planoAcao, {
    nullable: false,
  })
  @JoinColumn({ name: 'checklist_execucao_id' })
  checklistExecucao: ChecklistExecucao;

  @Column({ name: 'checklist_execucao_id' })
  checklistExecucaoId: number;

  @OneToMany(() => AcaoCorretiva, (acao) => acao.planoAcao, {
    cascade: true,
  })
  acoesCorretivas: AcaoCorretiva[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
