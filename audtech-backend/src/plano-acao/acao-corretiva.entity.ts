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
import { StatusAcao } from '../common/enums/status.enum';
import { PlanoAcao } from './plano-acao.entity';
import { NaoConformidade } from '../checklist-execucao/nao-conformidade.entity';
import { Usuario } from '../usuario/usuario.entity';
import { EvidenciaAcao } from './evidencia-acao.entity';

@Entity('acoes_corretivas')
export class AcaoCorretiva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'date' })
  prazo: string;

  @Column({ type: 'varchar', default: StatusAcao.PENDENTE })
  status: StatusAcao;

  // Obrigatória quando status = CANCELADO
  @Column({ type: 'text', nullable: true })
  justificativaCancelamento: string;

  @ManyToOne(() => PlanoAcao, (plano) => plano.acoesCorretivas, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plano_acao_id' })
  planoAcao: PlanoAcao;

  @Column({ name: 'plano_acao_id' })
  planoAcaoId: number;

  @ManyToOne(() => NaoConformidade, (nc) => nc.acoesCorretivas, {
    nullable: false,
  })
  @JoinColumn({ name: 'nao_conformidade_id' })
  naoConformidade: NaoConformidade;

  @Column({ name: 'nao_conformidade_id' })
  naoConformidadeId: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.acoesCorretivas, {
    nullable: true,
  })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: Usuario | null;

  @Column({ name: 'responsavel_id', nullable: true })
  responsavelId: number | null;

  @OneToMany(() => EvidenciaAcao, (ev) => ev.acaoCorretiva, {
    cascade: true,
  })
  evidencias: EvidenciaAcao[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
