import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Or } from 'typeorm';
import { ChecklistTemplate } from './checklist-template.entity';
import { ItemTemplate } from './item-template.entity';
import {
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
} from './dto/create-template.dto';
import { Status } from '../common/enums/status.enum';

@Injectable()
export class ChecklistTemplateService {
  constructor(
    @InjectRepository(ChecklistTemplate)
    private readonly templateRepo: Repository<ChecklistTemplate>,
    @InjectRepository(ItemTemplate)
    private readonly itemRepo: Repository<ItemTemplate>,
  ) { }

  async criar(
    dto: CreateChecklistTemplateDto,
    empresaId: number | null,
    global = false,
  ): Promise<ChecklistTemplate> {
    if (!dto.itens || dto.itens.length === 0) {
      throw new BadRequestException('O template deve ter ao menos um item.');
    }

    const template = this.templateRepo.create({
      titulo: dto.titulo,
      tipoNorma: dto.tipoNorma,
      descricao: dto.descricao,
      empresaId: global ? null : empresaId,
      global,
      status: Status.ATIVO,
    });

    const salvo = await this.templateRepo.save(template);

    const itens = dto.itens.map(item =>
      this.itemRepo.create({ ...item, checklistTemplateId: salvo.id }),
    );
    await this.itemRepo.save(itens);

    return this.buscarPorId(salvo.id, global ? null : empresaId);
  }


  async listar(empresaId: number): Promise<ChecklistTemplate[]> {
    return this.templateRepo.find({
      where: [
        { empresaId },
        { global: true },
      ],
      relations: ['itens'],
      order: { titulo: 'ASC' },
    });
  }

  async listarAtivos(empresaId: number): Promise<ChecklistTemplate[]> {
    return this.templateRepo.find({
      where: [
        { empresaId, status: Status.ATIVO },
        { global: true, status: Status.ATIVO },
      ],
      relations: ['itens'],
      order: { titulo: 'ASC' },
    });
  }

  async listarGlobais(): Promise<ChecklistTemplate[]> {
    return this.templateRepo.find({
      where: { global: true },
      relations: ['itens'],
      order: { titulo: 'ASC' },
    });
  }

  async buscarPorId(id: number, empresaId: number | null): Promise<ChecklistTemplate> {
    const where: any = empresaId
      ? [{ id, empresaId }, { id, global: true }]
      : [{ id }];

    const template = await this.templateRepo.findOne({
      where,
      relations: ['itens'],
    });

    if (!template) {
      throw new NotFoundException(`Template #${id} não encontrado.`);
    }

    template.itens?.sort((a, b) =>
      a.grupo.localeCompare(b.grupo) || a.ordem - b.ordem,
    );

    return template;
  }

  async atualizar(
    id: number,
    dto: UpdateChecklistTemplateDto,
    empresaId: number | null,
  ): Promise<ChecklistTemplate> {
    const template = await this.buscarPorId(id, empresaId);

    // Empresa não pode editar template global
    if (template.global && empresaId !== null) {
      throw new BadRequestException('Templates globais não podem ser editados por empresas.');
    }

    const execucoesVinculadas = await this.templateRepo
      .createQueryBuilder('t')
      .innerJoin('t.execucoes', 'e')
      .where('t.id = :id', { id })
      .getCount();

    if (execucoesVinculadas > 0 && dto.itens) {
      throw new BadRequestException(
        'Não é possível alterar os itens de um template que já possui execuções vinculadas.',
      );
    }

    const { itens, ...dadosTemplate } = dto as any;
    Object.assign(template, dadosTemplate);
    await this.templateRepo.save(template);

    if (itens && itens.length > 0) {
      await this.itemRepo.delete({ checklistTemplateId: id });
      const novosItens = itens.map((item: any) =>
        this.itemRepo.create({ ...item, checklistTemplateId: id }),
      );
      await this.itemRepo.save(novosItens);
    }

    return this.buscarPorId(id, empresaId);
  }

  async inativar(id: number, empresaId: number | null): Promise<{ mensagem: string }> {
    const template = await this.buscarPorId(id, empresaId);

    if (template.global && empresaId !== null) {
      throw new BadRequestException('Templates globais não podem ser inativados por empresas.');
    }

    template.status = Status.INATIVO;
    await this.templateRepo.save(template);
    return { mensagem: 'Template inativado com sucesso.' };
  }
}
