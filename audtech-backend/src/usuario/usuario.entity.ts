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
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';
import { Status } from '../common/enums/status.enum';
import { Empresa } from '../empresa/empresa.entity';
import { ChecklistExecucao } from '../checklist-execucao/checklist-execucao.entity';
import { AcaoCorretiva } from '../plano-acao/acao-corretiva.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  perfil: PerfilUsuario;

  @Column({ length: 150 })
  nome: string;

  @Column({ unique: true, length: 14 })
  cpf: string;

  @Column({ unique: true, length: 200 })
  email: string;

  @Column()
  senhaHash: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  // Apenas para perfil ADMIN
  @Column({ length: 100, nullable: true })
  cargo: string;

  // Apenas para perfil RAC
  @Column({ length: 100, nullable: true })
  departamento: string;

  @Column({ type: 'varchar', default: Status.ATIVO })
  status: Status;

  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios, { nullable: true })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa | null;

  @Column({ name: 'empresa_id', nullable: true })
  empresaId: number | null;

  // Relação para Auditor: checklists que ele executa
  @OneToMany(() => ChecklistExecucao, (execucao) => execucao.auditor)
  checklistsExecutados: ChecklistExecucao[];

  // Relação para RAC: ações corretivas atribuídas a ele
  @OneToMany(() => AcaoCorretiva, (acao) => acao.responsavel)
  acoesCorretivas: AcaoCorretiva[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
