import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ChecklistExecucao } from './checklist-execucao.entity';
import { ItemExecucao } from './item-execucao.entity';
import { Evidencia } from './evidencia.entity';
import { Pendencia } from './pendencia.entity';
import { NaoConformidade } from './nao-conformidade.entity';
import { ChecklistTemplate } from '../checklist-template/checklist-template.entity';
import { Usuario } from '../usuario/usuario.entity';
import { PlanoAcao } from '../plano-acao/plano-acao.entity';
import { AcaoCorretiva } from '../plano-acao/acao-corretiva.entity';
import {
  CreateExecucaoDto,
  UpdateItemExecucaoDto,
  CreatePendenciaDto,
  CreateNaoConformidadeDto,
  AssinarChecklistDto,
} from './dto/create-execucao.dto';
import { StatusChecklist, StatusAcao, StatusNaoConformidade } from '../common/enums/status.enum';
import { ResultadoItem, CategoriaPendencia, TipoArquivo } from '../common/enums/resultado-item.enum';
import { CriticidadeAmbiental } from '../common/enums/criticidade.enum';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';
import { Status } from '../common/enums/status.enum';

@Injectable()
export class ChecklistExecucaoService {
  constructor(
    @InjectRepository(ChecklistExecucao)
    private readonly execucaoRepo: Repository<ChecklistExecucao>,
    @InjectRepository(ItemExecucao)
    private readonly itemRepo: Repository<ItemExecucao>,
    @InjectRepository(Evidencia)
    private readonly evidenciaRepo: Repository<Evidencia>,
    @InjectRepository(Pendencia)
    private readonly pendenciaRepo: Repository<Pendencia>,
    @InjectRepository(NaoConformidade)
    private readonly ncRepo: Repository<NaoConformidade>,
    @InjectRepository(ChecklistTemplate)
    private readonly templateRepo: Repository<ChecklistTemplate>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(PlanoAcao)
    private readonly planoRepo: Repository<PlanoAcao>,
    @InjectRepository(AcaoCorretiva)
    private readonly acaoRepo: Repository<AcaoCorretiva>,
    private readonly dataSource: DataSource,
  ) { }

  // ─── EXECUÇÃO ────────────────────────────────────────────────────────────────

  async criar(dto: CreateExecucaoDto, empresaId: number): Promise<ChecklistExecucao> {
    const template = await this.templateRepo.findOne({
      where: [
        { id: dto.templateId, empresaId, status: Status.ATIVO },
        { id: dto.templateId, global: true, status: Status.ATIVO },
      ],
      relations: ['itens'],
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado ou inativo.');
    }

    const auditor = await this.usuarioRepo.findOne({
      where: {
        id: dto.auditorId,
        empresaId,
        perfil: PerfilUsuario.AUDITOR,
        status: Status.ATIVO,
      },
    });
    if (!auditor) {
      throw new NotFoundException('Auditor não encontrado ou inativo.');
    }

    if (dto.prazo) {
      const prazoDate = new Date(dto.prazo + 'T00:00:00-03:00');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (prazoDate < hoje) {
        throw new BadRequestException('O prazo não pode ser uma data retroativa.');
      }
    }

    // Cria execução e instancia todos os itens do template em uma transação
    return this.dataSource.transaction(async (manager) => {
      const execucao = manager.create(ChecklistExecucao, {
        templateId: dto.templateId,
        auditorId: dto.auditorId,
        empresaId,
        prazo: dto.prazo,
        status: StatusChecklist.PENDENTE,
      });
      const execucaoSalva = await manager.save(execucao);

      // Instancia um ItemExecucao para cada item do template
      const itens = template.itens.map((itemTemplate) =>
        manager.create(ItemExecucao, {
          checklistExecucaoId: execucaoSalva.id,
          itemTemplateId: itemTemplate.id,
        }),
      );
      await manager.save(itens);

      return this.buscarPorId(execucaoSalva.id, empresaId);
    });
  }

  async listar(usuarioId: number, perfil: PerfilUsuario, empresaId: number) {
    const qb = this.execucaoRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.auditor', 'auditor')
      .leftJoinAndSelect('e.template', 'template')
      .where('e.empresaId = :empresaId', { empresaId });

    // Auditor só vê suas próprias execuções
    if (perfil === PerfilUsuario.AUDITOR) {
      qb.andWhere('e.auditorId = :auditorId', { auditorId: usuarioId });
    }

    return qb.orderBy('e.criadoEm', 'DESC').getMany();
  }

  async buscarPorId(id: number, empresaId: number): Promise<ChecklistExecucao> {
    const execucao = await this.execucaoRepo.findOne({
      where: { id, empresaId },
      relations: [
        'auditor',
        'template',
        'itens',
        'itens.itemTemplate',
        'itens.evidencias',
        'itens.pendencias',
        'itens.naoConformidades',
        'planoAcao',
      ],
    });
    if (!execucao) {
      throw new NotFoundException(`Execução #${id} não encontrada.`);
    }
    return execucao;
  }

  // ─── ITEM ─────────────────────────────────────────────────────────────────────

  async atualizarItem(
    execucaoId: number,
    itemId: number,
    dto: UpdateItemExecucaoDto,
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<ItemExecucao> {
    const execucao = await this.execucaoRepo.findOne({
      where: { id: execucaoId, empresaId },
    });
    if (!execucao) throw new NotFoundException('Execução não encontrada.');

    this.verificarBloqueio(execucao);
    this.verificarPermissaoAuditor(execucao, usuarioId, perfil);

    const item = await this.itemRepo.findOne({
      where: { id: itemId, checklistExecucaoId: execucaoId },
      relations: ['evidencias'],
    });
    if (!item) throw new NotFoundException(`Item #${itemId} não encontrado.`);

    // Remove a validação de evidência aqui — será validado na assinatura

    if (dto.prazo) {
      const prazoDate = new Date(dto.prazo + 'T00:00:00');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      prazoDate.setHours(0, 0, 0, 0);
      if (prazoDate < hoje) {
        throw new BadRequestException('O prazo não pode ser uma data retroativa.');
      }
    }

    Object.assign(item, dto);
    const salvo = await this.itemRepo.save(item);
    await this.recalcularStatusExecucao(execucaoId);
    return salvo;
  }

  // ─── EVIDÊNCIAS ───────────────────────────────────────────────────────────────

  async adicionarEvidencia(
    execucaoId: number,
    itemId: number,
    arquivo: Express.Multer.File,
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<Evidencia> {
    const execucao = await this.execucaoRepo.findOne({
      where: { id: execucaoId, empresaId },
    });
    if (!execucao) throw new NotFoundException('Execução não encontrada.');

    this.verificarBloqueio(execucao);
    this.verificarPermissaoAuditor(execucao, usuarioId, perfil);

    const item = await this.itemRepo.findOne({
      where: { id: itemId, checklistExecucaoId: execucaoId },
    });
    if (!item) throw new NotFoundException(`Item #${itemId} não encontrado.`);

    const extensao = arquivo.originalname.split('.').pop()?.toUpperCase() as TipoArquivo;

    const evidencia = this.evidenciaRepo.create({
      itemExecucaoId: itemId,
      arquivoUrl: arquivo.path,
      tipoArquivo: extensao,
      nomeOriginal: arquivo.originalname,
    });

    return this.evidenciaRepo.save(evidencia);
  }

  async removerEvidencia(
    evidenciaId: number,
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<{ mensagem: string }> {
    const evidencia = await this.evidenciaRepo.findOne({
      where: { id: evidenciaId },
      relations: ['itemExecucao', 'itemExecucao.checklistExecucao'],
    });

    if (!evidencia) throw new NotFoundException('Evidência não encontrada.');

    const execucao = evidencia.itemExecucao.checklistExecucao;
    if (execucao.empresaId !== empresaId) throw new ForbiddenException();

    this.verificarBloqueio(execucao);
    this.verificarPermissaoAuditor(execucao, usuarioId, perfil);

    await this.evidenciaRepo.remove(evidencia);
    return { mensagem: 'Evidência removida com sucesso.' };
  }

  // ─── PENDÊNCIAS ───────────────────────────────────────────────────────────────

  async adicionarPendencia(
    execucaoId: number,
    itemId: number,
    dto: CreatePendenciaDto,
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<Pendencia> {
    const execucao = await this.execucaoRepo.findOne({
      where: { id: execucaoId, empresaId },
    });
    if (!execucao) throw new NotFoundException('Execução não encontrada.');

    this.verificarBloqueio(execucao);
    this.verificarPermissaoAuditor(execucao, usuarioId, perfil);

    // Pendência ambiental exige criticidade
    if (
      dto.categoria === CategoriaPendencia.AMBIENTAL &&
      !dto.criticidade
    ) {
      throw new BadRequestException(
        'Pendências ambientais exigem o campo "criticidade" (BAIXA, MEDIA ou ALTA).',
      );
    }

    // Pendência documental exige referência normativa
    if (
      dto.categoria === CategoriaPendencia.DOCUMENTAL &&
      !dto.referenciaNormativa
    ) {
      throw new BadRequestException(
        'Pendências documentais exigem o campo "referenciaNormativa".',
      );
    }

    const pendencia = this.pendenciaRepo.create({
      ...dto,
      itemExecucaoId: itemId,
    });

    const salva = await this.pendenciaRepo.save(pendencia);

    // Alerta automático para pendência ambiental ALTA — no mundo real: emitir evento/notificação
    if (
      dto.categoria === CategoriaPendencia.AMBIENTAL &&
      dto.criticidade === CriticidadeAmbiental.ALTA
    ) {
      // TODO: integrar com NotificacaoService quando implementado
      console.warn(
        `[ALERTA] Pendência ambiental de criticidade ALTA registrada na execução #${execucaoId}, item #${itemId}`,
      );
    }

    return salva;
  }

  // ─── NÃO CONFORMIDADES ────────────────────────────────────────────────────────

  async adicionarNaoConformidade(
    execucaoId: number,
    itemId: number,
    dto: CreateNaoConformidadeDto,
    usuarioId: number,
    perfil: PerfilUsuario,
    empresaId: number,
  ): Promise<NaoConformidade> {
    const execucao = await this.execucaoRepo.findOne({
      where: { id: execucaoId, empresaId },
    });
    if (!execucao) throw new NotFoundException('Execução não encontrada.');

    this.verificarBloqueio(execucao);
    this.verificarPermissaoAuditor(execucao, usuarioId, perfil);

    const nc = this.ncRepo.create({
      ...dto,
      itemExecucaoId: itemId,
      status: StatusNaoConformidade.ABERTA,
    });

    return this.ncRepo.save(nc);
  }

  // ─── ASSINATURA ───────────────────────────────────────────────────────────────

  async assinar(
    execucaoId: number,
    dto: AssinarChecklistDto,
    usuario: any,
    empresaId: number,
  ): Promise<ChecklistExecucao> {
    const execucao = await this.buscarPorId(execucaoId, empresaId);

    // Valida que itens não conformes têm evidência
    const itensSemEvidencia = execucao.itens.filter(
      i => i.resultado === ResultadoItem.NAO_CONFORME && i.evidencias.length === 0,
    );
    console.log('Itens sem evidência:', itensSemEvidencia.map(i => ({ id: i.id, evidencias: i.evidencias.length })));
    console.log('Itens não conformes:', execucao.itens.filter(i => i.resultado === ResultadoItem.NAO_CONFORME).map(i => ({ id: i.id, evidencias: i.evidencias.length })));
    if (itensSemEvidencia.length > 0) {
      throw new BadRequestException(
        `Existem ${itensSemEvidencia.length} item(ns) não conforme(s) sem evidência fotográfica.`,
      );
    }

    if (execucao.assinadoEm) {
      throw new BadRequestException('Este checklist já foi assinado.');
    }

    if (
      usuario.perfil !== PerfilUsuario.AUDITOR &&
      usuario.perfil !== PerfilUsuario.ADMIN
    ) {
      throw new ForbiddenException(
        'Apenas Auditores ou Administradores podem assinar o checklist.',
      );
    }

    // Valida todos os itens preenchidos
    const itensSemResposta = execucao.itens.filter((i) => !i.resultado);
    if (itensSemResposta.length > 0) {
      throw new BadRequestException(
        `Existem ${itensSemResposta.length} item(ns) sem resposta. Preencha todos antes de assinar.`,
      );
    }

    // Para assinatura por credencial, re-valida a senha
    if (dto.tipoAssinatura === 'CREDENCIAL') {
      const usuarioDb = await this.usuarioRepo.findOne({
        where: { id: usuario.id },
      });
      const senhaValida = await bcrypt.compare(dto.senha, usuarioDb.senhaHash);
      if (!senhaValida) {
        throw new ForbiddenException('Senha incorreta. Assinatura não autorizada.');
      }
    }

    execucao.assinatura = dto.assinatura ?? 'CREDENCIAL_CONFIRMADA';
    execucao.tipoAssinatura = dto.tipoAssinatura;
    execucao.assinadoEm = new Date();
    execucao.status = StatusChecklist.CONCLUIDO;
    execucao.dataConclusao = new Date().toISOString().split('T')[0];

    const salvo = await this.execucaoRepo.save(execucao);
    await this.gerarPlanoAcaoSeNecessario(execucaoId);

    return this.buscarPorId(execucaoId, empresaId);
  }

  // ─── HELPERS PRIVADOS ─────────────────────────────────────────────────────────

  private verificarBloqueio(execucao: ChecklistExecucao): void {
    if (execucao.assinadoEm) {
      throw new BadRequestException(
        'Este checklist já foi assinado e está bloqueado para edição.',
      );
    }
  }

  private verificarPermissaoAuditor(
    execucao: ChecklistExecucao,
    usuarioId: number,
    perfil: PerfilUsuario,
  ): void {
    if (
      perfil === PerfilUsuario.AUDITOR &&
      execucao.auditorId !== usuarioId
    ) {
      throw new ForbiddenException(
        'Você só pode editar checklists atribuídos a você.',
      );
    }
  }

  private async recalcularStatusExecucao(execucaoId: number): Promise<void> {
    const execucao = await this.execucaoRepo.findOne({
      where: { id: execucaoId },
      relations: ['itens'],
    });
    if (!execucao || execucao.assinadoEm) return;

    const totalItens = execucao.itens.length;
    const itensRespondidos = execucao.itens.filter((i) => i.resultado).length;

    let novoStatus: StatusChecklist = StatusChecklist.PENDENTE;

    if (itensRespondidos > 0 && itensRespondidos < totalItens) {
      novoStatus = StatusChecklist.EM_ANDAMENTO;
      if (!execucao.dataInicio) {
        execucao.dataInicio = new Date().toISOString().split('T')[0];
      }
    }

    if (execucao.prazo) {
      const prazoDate = new Date(execucao.prazo);
      const naoFoiConcluido = (novoStatus as StatusChecklist) !== StatusChecklist.CONCLUIDO;
      if (prazoDate < new Date() && naoFoiConcluido) {
        novoStatus = StatusChecklist.EM_ATRASO;
      }

      execucao.status = novoStatus;
      await this.execucaoRepo.save(execucao);
    }
  }

  private async gerarPlanoAcaoSeNecessario(execucaoId: number): Promise<void> {
    const naoConformidades = await this.ncRepo.find({
      where: { itemExecucao: { checklistExecucaoId: execucaoId } },
      relations: ['itemExecucao'],
    });

    if (naoConformidades.length === 0) return;

    const planoExistente = await this.planoRepo.findOne({
      where: { checklistExecucaoId: execucaoId },
    });
    if (planoExistente) return;

    await this.dataSource.transaction(async (manager) => {
      const plano = manager.create(PlanoAcao, {
        checklistExecucaoId: execucaoId,
        status: StatusAcao.PENDENTE,
      });
      const planoSalvo = await manager.save(plano);

      // Cria uma ação corretiva placeholder para cada não conformidade
      const acoes = naoConformidades.map((nc) =>
        manager.create(AcaoCorretiva, {
          planoAcaoId: planoSalvo.id,
          naoConformidadeId: nc.id,
          descricao: `Ação corretiva para: ${nc.descricao}`,
          prazo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // +30 dias padrão
          status: StatusAcao.PENDENTE,
          // responsavelId deve ser atribuído pelo Admin posteriormente
          responsavelId: null,
        }),
      );
      await manager.save(acoes);
    });
  }
}
