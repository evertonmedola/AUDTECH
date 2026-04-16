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
import { ResultadoItem } from '../common/enums/resultado-item.enum';
import { ChecklistExecucao } from './checklist-execucao.entity';
import { ItemTemplate } from '../checklist-template/item-template.entity';
import { Evidencia } from './evidencia.entity';
import { Pendencia } from './pendencia.entity';
import { NaoConformidade } from './nao-conformidade.entity';

@Entity('itens_execucao')
export class ItemExecucao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  resultado: ResultadoItem;

  // Máximo 1000 caracteres conforme requisito
  @Column({ type: 'text', nullable: true, length: 1000 })
  observacao: string;

  @Column({ type: 'date', nullable: true })
  prazo: string;

  @ManyToOne(() => ChecklistExecucao, (execucao) => execucao.itens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checklist_execucao_id' })
  checklistExecucao: ChecklistExecucao;

  @Column({ name: 'checklist_execucao_id' })
  checklistExecucaoId: number;

  @ManyToOne(() => ItemTemplate, (itemTemplate) => itemTemplate.itemsExecucao, {
    nullable: false,
  })
  @JoinColumn({ name: 'item_template_id' })
  itemTemplate: ItemTemplate;

  @Column({ name: 'item_template_id' })
  itemTemplateId: number;

  @OneToMany(() => Evidencia, (evidencia) => evidencia.itemExecucao, {
    cascade: true,
  })
  evidencias: Evidencia[];

  @OneToMany(() => Pendencia, (pendencia) => pendencia.itemExecucao, {
    cascade: true,
  })
  pendencias: Pendencia[];

  @OneToMany(() => NaoConformidade, (nc) => nc.itemExecucao, {
    cascade: true,
  })
  naoConformidades: NaoConformidade[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
