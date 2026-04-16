import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TipoArquivo } from '../common/enums/resultado-item.enum';
import { ItemExecucao } from './item-execucao.entity';

@Entity('evidencias')
export class Evidencia {
  @PrimaryGeneratedColumn()
  id: number;

  // Caminho relativo salvo em disco: uploads/evidencias/<uuid>.<ext>
  @Column()
  arquivoUrl: string;

  @Column({ type: 'varchar' })
  tipoArquivo: TipoArquivo;

  @Column({ length: 200, nullable: true })
  nomeOriginal: string;

  @ManyToOne(() => ItemExecucao, (item) => item.evidencias, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'item_execucao_id' })
  itemExecucao: ItemExecucao;

  @Column({ name: 'item_execucao_id' })
  itemExecucaoId: number;

  @CreateDateColumn()
  criadoEm: Date;
}
