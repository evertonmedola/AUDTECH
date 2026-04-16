import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TipoArquivo } from '../common/enums/resultado-item.enum';
import { AcaoCorretiva } from './acao-corretiva.entity';

@Entity('evidencias_acao')
export class EvidenciaAcao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  arquivoUrl: string;

  @Column({ type: 'varchar' })
  tipoArquivo: TipoArquivo;

  @Column({ length: 200, nullable: true })
  nomeOriginal: string;

  @ManyToOne(() => AcaoCorretiva, (acao) => acao.evidencias, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'acao_corretiva_id' })
  acaoCorretiva: AcaoCorretiva;

  @Column({ name: 'acao_corretiva_id' })
  acaoCorretivaId: number;

  @CreateDateColumn()
  criadoEm: Date;
}
