import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanoAcao } from './plano-acao.entity';
import { AcaoCorretiva } from './acao-corretiva.entity';
import { EvidenciaAcao } from './evidencia-acao.entity';
import { NaoConformidade } from '../checklist-execucao/nao-conformidade.entity';
import { PlanoAcaoService } from './plano-acao.service';
import { PlanoAcaoController } from './plano-acao.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanoAcao,
      AcaoCorretiva,
      EvidenciaAcao,
      NaoConformidade,
    ]),
  ],
  providers: [PlanoAcaoService],
  controllers: [PlanoAcaoController],
  exports: [PlanoAcaoService],
})
export class PlanoAcaoModule {}
