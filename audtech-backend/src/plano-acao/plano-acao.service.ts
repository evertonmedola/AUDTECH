import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanoAcao } from './plano-acao.entity';
import { AcaoCorretiva } from './acao-corretiva.entity';
import { EvidenciaAcao } from './evidencia-acao.entity';
import { NaoConformidade } from '../checklist-execucao/nao-conformidade.entity';
import { UpdateAcaoCorretivaDto } from './dto/update-acao-corretiva.dto';
import { StatusAcao, StatusNaoConformidade } from '../common/enums/status.enum';
import { TipoArquivo } from '../common/enums/resultado-item.enum';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';

@Injectable()
export class PlanoAcaoService {
  constructor(
    @InjectRepository(PlanoAcao)
    private readonly planoRepo: Repository<PlanoAcao>,
    @InjectRepository(AcaoCorretiva)
    private readonly acaoRepo: Repository<AcaoCorretiva>,
    @InjectRepository(EvidenciaAcao)
    private readonly evidenciaRepo: Repository<EvidenciaAcao>,
    @InjectRepository(NaoConformidade)
    private readonly ncRepo: Repository<NaoConformidade>,
  ) {}

  // ─── PLANO ────────────────────────────────────────────────────────────────────

  async buscarPorExecucao(
    execucaoId: number,
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<PlanoAcao> {
    const plano = await this.planoRepo.findOne({
      where: { checklistExecucaoId: execucaoId },
      relations: [
        'acoesCorretivas',
        'acoesCorretivas.responsavel',
        'acoesCorretivas.naoConformidade',
        'acoesCorretivas.evidencias',
        'checklistExecucao',
      ],
    });

    if (!plano) throw new NotFoundException('Plano de ação não encontrado.');
    if (plano.checklistExecucao.empresaId !== empresaId) throw new ForbiddenException();

    // RAC só vê ações atribuídas a ele
    if (perfil === PerfilUsuario.RAC) {
      plano.acoesCorretivas = plano.acoesCorretivas.filter(
        (a) => a.responsavelId === usuarioId,
      );
    }

    return plano;
  }

  async listarPorEmpresa(
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<PlanoAcao[]> {
    const qb = this.planoRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.checklistExecucao', 'exec')
      .leftJoinAndSelect('p.acoesCorretivas', 'acao')
      .where('exec.empresaId = :empresaId', { empresaId });

    if (perfil === PerfilUsuario.RAC) {
      qb.andWhere('acao.responsavelId = :uid', { uid: usuarioId });
    }

    return qb.orderBy('p.criadoEm', 'DESC').getMany();
  }

  // ─── AÇÕES CORRETIVAS ─────────────────────────────────────────────────────────

  async atualizarAcao(
    acaoId: number,
    dto: UpdateAcaoCorretivaDto,
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<AcaoCorretiva> {
    const acao = await this.acaoRepo.findOne({
      where: { id: acaoId },
      relations: ['planoAcao', 'planoAcao.checklistExecucao', 'evidencias'],
    });

    if (!acao) throw new NotFoundException(`Ação #${acaoId} não encontrada.`);
    if (acao.planoAcao.checklistExecucao.empresaId !== empresaId) {
      throw new ForbiddenException();
    }

    // RAC só pode atualizar suas próprias ações
    if (perfil === PerfilUsuario.RAC && acao.responsavelId !== usuarioId) {
      throw new ForbiddenException('Você só pode atualizar ações atribuídas a você.');
    }

    // Para concluir, evidência é obrigatória
    if (dto.status === StatusAcao.CONCLUIDO && acao.evidencias.length === 0) {
      throw new BadRequestException(
        'É necessário anexar ao menos uma evidência antes de concluir a ação.',
      );
    }

    // Para cancelar, justificativa é obrigatória
    if (dto.status === StatusAcao.CANCELADO && !dto.justificativaCancelamento) {
      throw new BadRequestException(
        'Informe a justificativa para cancelar esta ação.',
      );
    }

    if (dto.prazo) {
      const prazoDate = new Date(dto.prazo);
      if (prazoDate < new Date() && dto.status !== StatusAcao.CONCLUIDO) {
        throw new BadRequestException('O prazo não pode ser uma data retroativa.');
      }
    }

    // Apenas Admin pode reatribuir o responsável
    if (dto.responsavelId && perfil !== PerfilUsuario.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem reatribuir responsáveis.');
    }

    Object.assign(acao, dto);
    const salva = await this.acaoRepo.save(acao);

    // Recalcula status do plano e da não conformidade
    await this.recalcularStatusPlano(acao.planoAcaoId);
    await this.verificarEncerramentoNc(acao.naoConformidadeId);

    return salva;
  }

  // ─── EVIDÊNCIAS DA AÇÃO ───────────────────────────────────────────────────────

  async adicionarEvidencia(
    acaoId: number,
    arquivo: Express.Multer.File,
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<EvidenciaAcao> {
    const acao = await this.acaoRepo.findOne({
      where: { id: acaoId },
      relations: ['planoAcao', 'planoAcao.checklistExecucao'],
    });

    if (!acao) throw new NotFoundException(`Ação #${acaoId} não encontrada.`);
    if (acao.planoAcao.checklistExecucao.empresaId !== empresaId) {
      throw new ForbiddenException();
    }

    if (perfil === PerfilUsuario.RAC && acao.responsavelId !== usuarioId) {
      throw new ForbiddenException('Você só pode adicionar evidências às suas próprias ações.');
    }

    if (acao.status === StatusAcao.CONCLUIDO || acao.status === StatusAcao.CANCELADO) {
      throw new BadRequestException('Não é possível adicionar evidências a uma ação concluída ou cancelada.');
    }

    const extensao = arquivo.originalname.split('.').pop()?.toUpperCase() as TipoArquivo;

    const evidencia = this.evidenciaRepo.create({
      acaoCorretivaId: acaoId,
      arquivoUrl: arquivo.path,
      tipoArquivo: extensao,
      nomeOriginal: arquivo.originalname,
    });

    return this.evidenciaRepo.save(evidencia);
  }

  // ─── HELPERS PRIVADOS ─────────────────────────────────────────────────────────

  private async recalcularStatusPlano(planoId: number): Promise<void> {
    const plano = await this.planoRepo.findOne({
      where: { id: planoId },
      relations: ['acoesCorretivas'],
    });
    if (!plano) return;

    const todas = plano.acoesCorretivas;
    const concluidas = todas.filter(
      (a) => a.status === StatusAcao.CONCLUIDO || a.status === StatusAcao.CANCELADO,
    );

    let novoStatus: StatusAcao;

    if (concluidas.length === todas.length) {
      novoStatus = StatusAcao.CONCLUIDO;
    } else if (todas.some((a) => a.status === StatusAcao.EM_ANDAMENTO)) {
      novoStatus = StatusAcao.EM_ANDAMENTO;
    } else if (todas.some((a) => a.status === StatusAcao.EM_ATRASO)) {
      novoStatus = StatusAcao.EM_ATRASO;
    } else {
      novoStatus = StatusAcao.PENDENTE;
    }

    plano.status = novoStatus;
    await this.planoRepo.save(plano);
  }

  private async verificarEncerramentoNc(ncId: number): Promise<void> {
    const nc = await this.ncRepo.findOne({
      where: { id: ncId },
      relations: ['acoesCorretivas'],
    });
    if (!nc) return;

    const todasConcluidas = nc.acoesCorretivas.every(
      (a) => a.status === StatusAcao.CONCLUIDO || a.status === StatusAcao.CANCELADO,
    );

    if (todasConcluidas) {
      nc.status = StatusNaoConformidade.ENCERRADA;
      await this.ncRepo.save(nc);
    }
  }
}
