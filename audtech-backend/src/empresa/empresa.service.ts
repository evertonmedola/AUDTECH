import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './empresa.entity';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/create-empresa.dto';
import { Status } from '../common/enums/status.enum';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  async criar(dto: CreateEmpresaDto): Promise<Empresa> {
    const cnpjLimpo = dto.cnpj.replace(/\D/g, '');

    const existe = await this.empresaRepo.findOne({
      where: { cnpj: cnpjLimpo },
    });
    if (existe) {
      throw new ConflictException('Já existe uma empresa com este CNPJ.');
    }

    const empresa = this.empresaRepo.create({
      ...dto,
      cnpj: cnpjLimpo,
      status: Status.ATIVO,
    });

    return this.empresaRepo.save(empresa);
  }

  async listar(): Promise<Empresa[]> {
    return this.empresaRepo.find({
      order: { razaoSocial: 'ASC' },
    });
  }

  async buscarPorId(id: number): Promise<Empresa> {
    const empresa = await this.empresaRepo.findOne({
      where: { id },
      relations: ['usuarios'],
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa #${id} não encontrada.`);
    }
    return empresa;
  }

  async atualizar(id: number, dto: UpdateEmpresaDto): Promise<Empresa> {
    const empresa = await this.buscarPorId(id);

    if (dto.cnpj) {
      const cnpjLimpo = dto.cnpj.replace(/\D/g, '');
      const duplicado = await this.empresaRepo.findOne({
        where: { cnpj: cnpjLimpo },
      });
      if (duplicado && duplicado.id !== id) {
        throw new ConflictException('Já existe uma empresa com este CNPJ.');
      }
      dto.cnpj = cnpjLimpo;
    }

    Object.assign(empresa, dto);
    return this.empresaRepo.save(empresa);
  }

  async inativar(id: number): Promise<{ mensagem: string }> {
    const empresa = await this.empresaRepo.findOne({
      where: { id },
      relations: ['usuarios', 'checklistExecucoes'],
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa #${id} não encontrada.`);
    }

    const usuariosAtivos = empresa.usuarios?.filter(
      (u) => u.status === Status.ATIVO,
    );

    if (usuariosAtivos?.length > 0) {
      throw new BadRequestException(
        `Existem ${usuariosAtivos.length} usuário(s) ativo(s) vinculados. Inative-os antes de inativar a empresa.`,
      );
    }

    empresa.status = Status.INATIVO;
    await this.empresaRepo.save(empresa);

    return { mensagem: 'Empresa inativada com sucesso.' };
  }
}
