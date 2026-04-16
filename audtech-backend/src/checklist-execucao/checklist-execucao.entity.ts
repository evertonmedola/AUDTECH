import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusChecklist } from '../common/enums/status.enum';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';
import { ChecklistTemplate } from '../checklist-template/checklist-template.entity';
import { ItemExecucao } from './item-execucao.entity';
import { PlanoAcao } from '../plano-acao/plano-acao.entity';

@Entity('checklist_execucoes')
export class ChecklistExecucao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', default: StatusChecklist.PENDENTE })
  status: StatusChecklist;

  @Column({ type: 'date', nullable: true })
  dataInicio: string;

  @Column({ type: 'date', nullable: true })
  dataConclusao: string;

  @Column({ type: 'date', nullable: true })
  prazo: string;

  // Assinatura digital: base64 do desenho ou flag de confirmação por credencial
  @Column({ type: 'text', nullable: true })
  assinatura: string;

  @Column({ type: 'varchar', nullable: true })
  tipoAssinatura: 'DESENHO' | 'CREDENCIAL';

  @Column({ type: 'datetime', nullable: true })
  assinadoEm: Date;

  @ManyToOne(() => Empresa, (empresa) => empresa.checklistExecucoes, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.checklistsExecutados, { nullable: false })
  @JoinColumn({ name: 'auditor_id' })
  auditor: Usuario;

  @Column({ name: 'auditor_id' })
  auditorId: number;

  @ManyToOne(() => ChecklistTemplate, (template) => template.execucoes, { nullable: false })
  @JoinColumn({ name: 'template_id' })
  template: ChecklistTemplate;

  @Column({ name: 'template_id' })
  templateId: number;

  @OneToMany(() => ItemExecucao, (item) => item.checklistExecucao, {
    cascade: true,
  })
  itens: ItemExecucao[];

  @OneToOne(() => PlanoAcao, (plano) => plano.checklistExecucao)
  planoAcao: PlanoAcao;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
