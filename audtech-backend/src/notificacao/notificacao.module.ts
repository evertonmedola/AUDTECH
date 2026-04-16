import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistExecucao } from '../checklist-execucao/checklist-execucao.entity';
import { AcaoCorretiva } from '../plano-acao/acao-corretiva.entity';
import { NotificacaoService } from './notificacao.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChecklistExecucao, AcaoCorretiva])],
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}
