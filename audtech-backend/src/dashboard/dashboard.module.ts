import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistExecucao } from '../checklist-execucao/checklist-execucao.entity';
import { AcaoCorretiva } from '../plano-acao/acao-corretiva.entity';
import { NaoConformidade } from '../checklist-execucao/nao-conformidade.entity';
import { PlanoAcao } from '../plano-acao/plano-acao.entity';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChecklistExecucao,
      AcaoCorretiva,
      NaoConformidade,
      PlanoAcao,
      Empresa,
      Usuario,
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule { }