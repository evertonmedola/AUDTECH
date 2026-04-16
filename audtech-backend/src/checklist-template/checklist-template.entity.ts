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
import { TipoNorma } from '../common/enums/tipo-norma.enum';
import { Status } from '../common/enums/status.enum';
import { Empresa } from '../empresa/empresa.entity';
import { ItemTemplate } from './item-template.entity';
import { ChecklistExecucao } from '../checklist-execucao/checklist-execucao.entity';

@Entity('checklist_templates')
export class ChecklistTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'varchar' })
  tipoNorma: TipoNorma;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'varchar', default: Status.ATIVO })
  status: Status;

  // true = template global criado pelo SUPERADMIN
  @Column({ type: 'boolean', default: false })
  global: boolean;

  @ManyToOne(() => Empresa, (empresa) => empresa.checklistTemplates, { nullable: true })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa | null;

  @Column({ name: 'empresa_id', nullable: true })
  empresaId: number | null;

  @OneToMany(() => ItemTemplate, (item) => item.checklistTemplate, {
    cascade: true,
    eager: false,
  })
  itens: ItemTemplate[];

  @OneToMany(() => ChecklistExecucao, (execucao) => execucao.template)
  execucoes: ChecklistExecucao[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
