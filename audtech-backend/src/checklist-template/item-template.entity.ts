import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChecklistTemplate } from './checklist-template.entity';
import { ItemExecucao } from '../checklist-execucao/item-execucao.entity';

@Entity('itens_template')
export class ItemTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  grupo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'int', default: 0 })
  ordem: number;

  @ManyToOne(() => ChecklistTemplate, (template) => template.itens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checklist_template_id' })
  checklistTemplate: ChecklistTemplate;

  @Column({ name: 'checklist_template_id' })
  checklistTemplateId: number;

  @OneToMany(() => ItemExecucao, (itemExec) => itemExec.itemTemplate)
  itemsExecucao: ItemExecucao[];
}
