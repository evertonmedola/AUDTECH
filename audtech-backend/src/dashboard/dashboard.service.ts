import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistExecucao } from '../checklist-execucao/checklist-execucao.entity';
import { AcaoCorretiva } from '../plano-acao/acao-corretiva.entity';
import { NaoConformidade } from '../checklist-execucao/nao-conformidade.entity';
import { PlanoAcao } from '../plano-acao/plano-acao.entity';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';
import { StatusChecklist, StatusAcao } from '../common/enums/status.enum';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ChecklistExecucao)
    private readonly execucaoRepo: Repository<ChecklistExecucao>,
    @InjectRepository(AcaoCorretiva)
    private readonly acaoRepo: Repository<AcaoCorretiva>,
    @InjectRepository(NaoConformidade)
    private readonly ncRepo: Repository<NaoConformidade>,
    @InjectRepository(PlanoAcao)
    private readonly planoRepo: Repository<PlanoAcao>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) { }

  async getDados(usuarioId: number, perfil: PerfilUsuario, empresaId: number) {
    if (perfil === PerfilUsuario.RAC) {
      return this.getDadosRac(usuarioId);
    }
    if (perfil === PerfilUsuario.AUDITOR) {
      return this.getDadosAuditor(usuarioId, empresaId);
    }
    return this.getDadosAdmin(empresaId);
  }

  // ─── ADMIN: visão completa ───────────────────────────────────────────────────

  private async getDadosAdmin(empresaId: number) {
    const [
      statusChecklists,
      evolucaoMensal,
      naoConformidadesPorCategoria,
      naoConformidadesPorCriticidade,
      percentualPlanosAbertos,
      checklistsEmAtraso,
      acoesProximasVencimento,
    ] = await Promise.all([
      this.statusChecklists(empresaId),
      this.evolucaoMensal(empresaId),
      this.ncPorCategoria(empresaId),
      this.ncPorCriticidade(empresaId),
      this.percentualPlanosAbertos(empresaId),
      this.checklistsEmAtraso(empresaId),
      this.acoesProximasVencimento(empresaId),
    ]);

    return {
      statusChecklists,
      evolucaoMensal,
      naoConformidadesPorCategoria,
      naoConformidadesPorCriticidade,
      percentualPlanosAbertos,
      checklistsEmAtraso,
      acoesProximasVencimento,
    };
  }

  // ─── AUDITOR: apenas suas execuções ─────────────────────────────────────────

  private async getDadosAuditor(auditorId: number, empresaId: number) {
    const [statusChecklists, checklistsEmAtraso] = await Promise.all([
      this.execucaoRepo
        .createQueryBuilder('e')
        .select('e.status', 'status')
        .addSelect('COUNT(*)', 'total')
        .where('e.auditorId = :auditorId AND e.empresaId = :empresaId', {
          auditorId,
          empresaId,
        })
        .groupBy('e.status')
        .getRawMany(),
      this.execucaoRepo.find({
        where: { auditorId, status: StatusChecklist.EM_ATRASO },
        relations: ['template'],
        take: 10,
      }),
    ]);

    return { statusChecklists, checklistsEmAtraso };
  }

  // ─── RAC: apenas suas ações ──────────────────────────────────────────────────

  private async getDadosRac(racId: number) {
    const [statusAcoes, acoesProximas] = await Promise.all([
      this.acaoRepo
        .createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('COUNT(*)', 'total')
        .where('a.responsavelId = :racId', { racId })
        .groupBy('a.status')
        .getRawMany(),
      this.acaoRepo
        .createQueryBuilder('a')
        .where('a.responsavelId = :racId', { racId })
        .andWhere('a.status IN (:...status)', {
          status: [StatusAcao.PENDENTE, StatusAcao.EM_ANDAMENTO],
        })
        .andWhere('a.prazo <= :limite', {
          limite: this.dataEmDias(7),
        })
        .orderBy('a.prazo', 'ASC')
        .take(10)
        .getMany(),
    ]);

    return { statusAcoes, acoesProximas };
  }

  // ─── QUERIES COMPARTILHADAS ──────────────────────────────────────────────────

  private async statusChecklists(empresaId: number) {
    return this.execucaoRepo
      .createQueryBuilder('e')
      .select('e.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .where('e.empresaId = :empresaId', { empresaId })
      .groupBy('e.status')
      .getRawMany();
  }

  private async evolucaoMensal(empresaId: number) {
    return this.execucaoRepo
      .createQueryBuilder('e')
      .select("strftime('%Y-%m', e.criadoEm)", 'mes')
      .addSelect('COUNT(*)', 'total')
      .where('e.empresaId = :empresaId', { empresaId })
      .groupBy("strftime('%Y-%m', e.criadoEm)")
      .orderBy('mes', 'ASC')
      .getRawMany();
  }

  private async ncPorCategoria(empresaId: number) {
    return this.ncRepo
      .createQueryBuilder('nc')
      .innerJoin('nc.itemExecucao', 'ie')
      .innerJoin('ie.checklistExecucao', 'e')
      .select('p.categoria', 'categoria')
      .innerJoin('ie.pendencias', 'p')
      .addSelect('COUNT(*)', 'total')
      .where('e.empresaId = :empresaId', { empresaId })
      .groupBy('p.categoria')
      .getRawMany();
  }

  private async ncPorCriticidade(empresaId: number) {
    return this.ncRepo
      .createQueryBuilder('nc')
      .innerJoin('nc.itemExecucao', 'ie')
      .innerJoin('ie.checklistExecucao', 'e')
      .select('nc.criticidade', 'criticidade')
      .addSelect('COUNT(*)', 'total')
      .where('e.empresaId = :empresaId', { empresaId })
      .groupBy('nc.criticidade')
      .getRawMany();
  }

  private async percentualPlanosAbertos(empresaId: number) {
    const [total, concluidos] = await Promise.all([
      this.planoRepo
        .createQueryBuilder('p')
        .innerJoin('p.checklistExecucao', 'e')
        .where('e.empresaId = :empresaId', { empresaId })
        .getCount(),
      this.planoRepo
        .createQueryBuilder('p')
        .innerJoin('p.checklistExecucao', 'e')
        .where('e.empresaId = :empresaId', { empresaId })
        .andWhere('p.status = :status', { status: StatusAcao.CONCLUIDO })
        .getCount(),
    ]);

    return {
      total,
      concluidos,
      percentualConcluido: total > 0 ? Math.round((concluidos / total) * 100) : 0,
    };
  }

  private async checklistsEmAtraso(empresaId: number) {
    return this.execucaoRepo.find({
      where: { empresaId, status: StatusChecklist.EM_ATRASO },
      relations: ['auditor', 'template'],
      order: { prazo: 'ASC' },
      take: 10,
    });
  }

  private async acoesProximasVencimento(empresaId: number) {
    return this.acaoRepo
      .createQueryBuilder('a')
      .innerJoin('a.planoAcao', 'p')
      .innerJoin('p.checklistExecucao', 'e')
      .leftJoinAndSelect('a.responsavel', 'r')
      .where('e.empresaId = :empresaId', { empresaId })
      .andWhere('a.status IN (:...status)', {
        status: [StatusAcao.PENDENTE, StatusAcao.EM_ANDAMENTO],
      })
      .andWhere('a.prazo <= :limite', { limite: this.dataEmDias(7) })
      .orderBy('a.prazo', 'ASC')
      .take(10)
      .getMany();
  }

  private dataEmDias(dias: number): string {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0];
  }

  async getDadosSuperAdmin() {
    const [
      totalEmpresas,
      empresasAtivas,
      totalUsuarios,
      empresasComMaisAuditorias,
      auditoriasPorStatus,
    ] = await Promise.all([
      // Total de empresas
      this.empresaRepo.count(),

      // Empresas ativas
      this.empresaRepo.count({ where: { status: 'ATIVO' as any } }),

      // Total de usuários excluindo SUPERADMIN
      this.usuarioRepo
        .createQueryBuilder('u')
        .where('u.perfil != :perfil', { perfil: PerfilUsuario.SUPERADMIN })
        .getCount(),

      // Top 5 empresas com mais auditorias
      this.execucaoRepo
        .createQueryBuilder('e')
        .innerJoin('e.empresa', 'emp')
        .select('emp.razaoSocial', 'razaoSocial')
        .addSelect('COUNT(*)', 'total')
        .groupBy('emp.id')
        .orderBy('total', 'DESC')
        .limit(5)
        .getRawMany(),

      // Auditorias por status global
      this.execucaoRepo
        .createQueryBuilder('e')
        .select('e.status', 'status')
        .addSelect('COUNT(*)', 'total')
        .groupBy('e.status')
        .getRawMany(),
    ]);

    return {
      totalEmpresas,
      empresasAtivas,
      empresasInativas: totalEmpresas - empresasAtivas,
      totalUsuarios,
      empresasComMaisAuditorias,
      auditoriasPorStatus,
    };
  }
}
