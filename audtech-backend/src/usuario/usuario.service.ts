import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Empresa } from '../empresa/empresa.entity';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './usuario.entity';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/create-usuario.dto';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';
import { Status } from '../common/enums/status.enum';
import { CriarEmpresaComAdminDto, AdminDto } from './dto/criar-empresa-com-admin.dto';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly dataSource: DataSource,
  ) { }

  async criar(dto: CreateUsuarioDto): Promise<Omit<Usuario, 'senhaHash'>> {
    if (dto.perfil === PerfilUsuario.ADMIN && !dto.cargo) {
      throw new BadRequestException('Campo "cargo" é obrigatório para o perfil Administrador.');
    }

    if (dto.perfil !== PerfilUsuario.SUPERADMIN && !dto.empresaId) {
      throw new BadRequestException('Campo "empresaId" é obrigatório.');
    }

    dto.nome = dto.nome.trim().replace(/\s+/g, ' ');
    const cpfLimpo = dto.cpf.replace(/\D/g, '');

    const cpfExiste = await this.usuarioRepo.findOne({ where: { cpf: cpfLimpo } });
    if (cpfExiste) throw new ConflictException('Já existe um usuário cadastrado com este CPF.');

    const emailExiste = await this.usuarioRepo.findOne({ where: { email: dto.email } });
    if (emailExiste) throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');

    const senhaHash = await bcrypt.hash(dto.senha, 12);

    const usuario = this.usuarioRepo.create({
      perfil: dto.perfil,
      nome: dto.nome,
      cpf: cpfLimpo,
      email: dto.email,
      senhaHash,
      telefone: dto.telefone,
      cargo: dto.perfil === PerfilUsuario.ADMIN ? dto.cargo : null,
      departamento: dto.perfil === PerfilUsuario.RAC ? dto.departamento : null,
      empresaId: dto.empresaId ?? null,
      status: Status.ATIVO,
    });

    const salvo = await this.usuarioRepo.save(usuario);
    return this.omitirSenha(salvo);
  }

  async listar(empresaId: number, perfil?: PerfilUsuario): Promise<Omit<Usuario, 'senhaHash'>[]> {
    const where: any = { empresaId };
    if (perfil) where.perfil = perfil;

    const usuarios = await this.usuarioRepo.find({
      where,
      order: { nome: 'ASC' },
    });

    return usuarios.map(this.omitirSenha);
  }

  async buscarPorId(id: number, empresaId?: number): Promise<Omit<Usuario, 'senhaHash'>> {
    const where: any = { id };
    if (empresaId) where.empresaId = empresaId;

    const usuario = await this.usuarioRepo.findOne({ where });
    if (!usuario) {
      throw new NotFoundException(`Usuário #${id} não encontrado.`);
    }

    return this.omitirSenha(usuario);
  }

  async atualizar(
    id: number,
    dto: UpdateUsuarioDto,
    solicitanteId: number,
    solicitantePerfil: PerfilUsuario,
  ): Promise<Omit<Usuario, 'senhaHash'>> {
    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuário #${id} não encontrado.`);
    }

    // Apenas Admin pode alterar status
    if (dto.status && solicitantePerfil !== PerfilUsuario.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem alterar o status de um usuário.');
    }

    // Usuário não-admin só pode editar a si mesmo
    if (solicitantePerfil !== PerfilUsuario.ADMIN && solicitanteId !== id) {
      throw new ForbiddenException('Você só pode editar seu próprio cadastro.');
    }

    if (dto.cpf) {
      const cpfLimpo = dto.cpf.replace(/\D/g, '');
      const duplicado = await this.usuarioRepo.findOne({ where: { cpf: cpfLimpo } });
      if (duplicado && duplicado.id !== id) {
        throw new ConflictException('CPF já cadastrado.');
      }
      dto.cpf = cpfLimpo;
    }

    if (dto.email) {
      const duplicado = await this.usuarioRepo.findOne({ where: { email: dto.email } });
      if (duplicado && duplicado.id !== id) {
        throw new ConflictException('E-mail já cadastrado.');
      }
    }

    if (dto.nome) {
      dto.nome = dto.nome.trim().replace(/\s+/g, ' ');
    }

    if (dto.senha) {
      (usuario as any).senhaHash = await bcrypt.hash(dto.senha, 12);
    }

    const { senha, ...dadosAtualizar } = dto as any;
    Object.assign(usuario, dadosAtualizar);

    const salvo = await this.usuarioRepo.save(usuario);
    return this.omitirSenha(salvo);
  }

  // Auditores ativos de uma empresa — para seleção em checklist
  async listarAuditoresAtivos(empresaId: number): Promise<Omit<Usuario, 'senhaHash'>[]> {
    const auditores = await this.usuarioRepo.find({
      where: {
        empresaId,
        perfil: PerfilUsuario.AUDITOR,
        status: Status.ATIVO,
      },
      order: { nome: 'ASC' },
    });
    return auditores.map(this.omitirSenha);
  }

  // RACs ativos de uma empresa — para atribuição em plano de ação
  async listarRacsAtivos(empresaId: number): Promise<Omit<Usuario, 'senhaHash'>[]> {
    const racs = await this.usuarioRepo.find({
      where: {
        empresaId,
        perfil: PerfilUsuario.RAC,
        status: Status.ATIVO,
      },
      order: { nome: 'ASC' },
    });
    return racs.map(this.omitirSenha);
  }

  async criarEmpresaComAdmin(dto: CriarEmpresaComAdminDto): Promise<{ empresa: Empresa; admin: Omit<Usuario, 'senhaHash'> }> {
    return this.dataSource.transaction(async (manager) => {
      // Verifica duplicidade de CNPJ
      const cnpjLimpo = dto.cnpj.replace(/\D/g, '');
      const empresaExiste = await manager.findOne(Empresa, { where: { cnpj: cnpjLimpo } });
      if (empresaExiste) throw new ConflictException('Já existe uma empresa com este CNPJ.');

      // Verifica duplicidade de e-mail e CPF do admin
      const emailExiste = await manager.findOne(Usuario, { where: { email: dto.admin.email } });
      if (emailExiste) throw new ConflictException('Já existe um usuário com este e-mail.');

      const cpfLimpo = dto.admin.cpf.replace(/\D/g, '');
      const cpfExiste = await manager.findOne(Usuario, { where: { cpf: cpfLimpo } });
      if (cpfExiste) throw new ConflictException('Já existe um usuário com este CPF.');

      // Cria a empresa
      const empresa = manager.create(Empresa, {
        razaoSocial: dto.razaoSocial,
        nomeFantasia: dto.nomeFantasia,
        cnpj: cnpjLimpo,
        segmento: dto.segmento,
        tipoEmpresa: dto.tipoEmpresa,
        telefone: dto.telefone,
        status: Status.ATIVO,
      });
      const empresaSalva = await manager.save(Empresa, empresa);

      // Cria o admin vinculado à empresa
      const senhaHash = await bcrypt.hash(dto.admin.senha, 12);
      const admin = manager.create(Usuario, {
        perfil: PerfilUsuario.ADMIN,
        nome: dto.admin.nome.trim().replace(/\s+/g, ' '),
        cpf: cpfLimpo,
        email: dto.admin.email,
        senhaHash,
        telefone: dto.admin.telefone,
        cargo: dto.admin.cargo,
        empresaId: empresaSalva.id,
        status: Status.ATIVO,
      });
      const adminSalvo = await manager.save(Usuario, admin);

      return { empresa: empresaSalva, admin: this.omitirSenha(adminSalvo) };
    });
  }

  async resetarSenha(usuarioId: number, novaSenha: string): Promise<void> {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException(`Usuário #${usuarioId} não encontrado.`);
    }

    usuario.senhaHash = await bcrypt.hash(novaSenha, 12);
    await this.usuarioRepo.save(usuario);
  }

  async trocarAdmin(empresaId: number, dto: CriarEmpresaComAdminDto['admin']): Promise<Omit<Usuario, 'senhaHash'>> {
    return this.dataSource.transaction(async (manager) => {
      // Inativa o admin atual
      const adminAtual = await manager.findOne(Usuario, {
        where: { empresaId, perfil: PerfilUsuario.ADMIN, status: Status.ATIVO },
      });
      if (adminAtual) {
        adminAtual.status = Status.INATIVO;
        await manager.save(Usuario, adminAtual);
      }

      // Verifica duplicidade de e-mail e CPF do novo admin
      const cpfLimpo = dto.cpf.replace(/\D/g, '');
      const cpfExiste = await manager.findOne(Usuario, { where: { cpf: cpfLimpo } });
      if (cpfExiste) throw new ConflictException('Já existe um usuário com este CPF.');

      const emailExiste = await manager.findOne(Usuario, { where: { email: dto.email } });
      if (emailExiste) throw new ConflictException('Já existe um usuário com este e-mail.');

      // Cria o novo admin
      const senhaHash = await bcrypt.hash(dto.senha, 12);
      const novoAdmin = manager.create(Usuario, {
        perfil: PerfilUsuario.ADMIN,
        nome: dto.nome.trim().replace(/\s+/g, ' '),
        cpf: cpfLimpo,
        email: dto.email,
        senhaHash,
        telefone: dto.telefone,
        cargo: dto.cargo,
        empresaId,
        status: Status.ATIVO,
      });

      const salvo = await manager.save(Usuario, novoAdmin);
      return this.omitirSenha(salvo);
    });
  }

  private omitirSenha(usuario: Usuario): Omit<Usuario, 'senhaHash'> {
    const { senhaHash, ...resto } = usuario as any;
    return resto;
  }
}
