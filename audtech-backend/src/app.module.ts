import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { Empresa } from './empresa/empresa.entity';
import { Usuario } from './usuario/usuario.entity';
import { ChecklistTemplate } from './checklist-template/checklist-template.entity';
import { ItemTemplate } from './checklist-template/item-template.entity';
import { ChecklistExecucao } from './checklist-execucao/checklist-execucao.entity';
import { ItemExecucao } from './checklist-execucao/item-execucao.entity';
import { Evidencia } from './checklist-execucao/evidencia.entity';
import { Pendencia } from './checklist-execucao/pendencia.entity';
import { NaoConformidade } from './checklist-execucao/nao-conformidade.entity';
import { PlanoAcao } from './plano-acao/plano-acao.entity';
import { AcaoCorretiva } from './plano-acao/acao-corretiva.entity';
import { EvidenciaAcao } from './plano-acao/evidencia-acao.entity';

import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './empresa/empresa.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ChecklistTemplateModule } from './checklist-template/checklist-template.module';
import { ChecklistExecucaoModule } from './checklist-execucao/checklist-execucao.module';
import { PlanoAcaoModule } from './plano-acao/plano-acao.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { NotificacaoModule } from './notificacao/notificacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: 'database.sqlite',
      autoSave: true,
      entities: [
        Empresa,
        Usuario,
        ChecklistTemplate,
        ItemTemplate,
        ChecklistExecucao,
        ItemExecucao,
        Evidencia,
        Pendencia,
        NaoConformidade,
        PlanoAcao,
        AcaoCorretiva,
        EvidenciaAcao,
      ],
      // Em produção: synchronize: false e usar migrations
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    }),

    ScheduleModule.forRoot(),

    AuthModule,
    EmpresaModule,
    UsuarioModule,
    ChecklistTemplateModule,
    ChecklistExecucaoModule,
    PlanoAcaoModule,
    DashboardModule,
    UploadModule,
    NotificacaoModule,
  ],
})
export class AppModule {}
