import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistExecucao } from './checklist-execucao.entity';
import { ItemExecucao } from './item-execucao.entity';
import { Evidencia } from './evidencia.entity';
import { Pendencia } from './pendencia.entity';
import { NaoConformidade } from './nao-conformidade.entity';
import { ChecklistTemplate } from '../checklist-template/checklist-template.entity';
import { Usuario } from '../usuario/usuario.entity';
import { PlanoAcao } from '../plano-acao/plano-acao.entity';
import { AcaoCorretiva } from '../plano-acao/acao-corretiva.entity';
import { ChecklistExecucaoService } from './checklist-execucao.service';
import { ChecklistExecucaoController } from './checklist-execucao.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChecklistExecucao,
      ItemExecucao,
      Evidencia,
      Pendencia,
      NaoConformidade,
      ChecklistTemplate,
      Usuario,
      PlanoAcao,
      AcaoCorretiva,
    ]),
  ],
  providers: [ChecklistExecucaoService],
  controllers: [ChecklistExecucaoController],
  exports: [ChecklistExecucaoService],
})
export class ChecklistExecucaoModule {}
