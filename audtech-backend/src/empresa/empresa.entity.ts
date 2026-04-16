import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Status } from '../common/enums/status.enum';
import { Usuario } from '../usuario/usuario.entity';
import { ChecklistTemplate } from '../checklist-template/checklist-template.entity';
import { ChecklistExecucao } from '../checklist-execucao/checklist-execucao.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  razaoSocial: string;

  @Column({ length: 150, nullable: true })
  nomeFantasia: string;

  @Column({ length: 100 })
  tipoEmpresa: string;

  @Column({ unique: true, length: 18 })
  cnpj: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'varchar', default: Status.ATIVO })
  status: Status;

  @OneToMany(() => Usuario, (usuario) => usuario.empresa)
  usuarios: Usuario[];

  @OneToMany(() => ChecklistTemplate, (template) => template.empresa)
  checklistTemplates: ChecklistTemplate[];

  @OneToMany(() => ChecklistExecucao, (execucao) => execucao.empresa)
  checklistExecucoes: ChecklistExecucao[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
