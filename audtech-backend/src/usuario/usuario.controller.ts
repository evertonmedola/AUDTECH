import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/create-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';
import { ResetarSenhaDto } from './dto/resetar-senha.dto';
import { AdminDto } from './dto/criar-empresa-com-admin.dto'; // adiciona

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) { }

  @Post()
  @Roles(PerfilUsuario.ADMIN)
  async criar(@Body() dto: CreateUsuarioDto) {
    const dados = await this.usuarioService.criar(dto);
    return { sucesso: true, dados };
  }

  @Get()
  @Roles(PerfilUsuario.ADMIN)
  async listar(
    @UsuarioAtual() usuario: any,
    @Query('perfil') perfil?: PerfilUsuario,
  ) {
    const dados = await this.usuarioService.listar(usuario.empresaId, perfil);
    return { sucesso: true, dados };
  }

  @Get('auditores-ativos')
  @Roles(PerfilUsuario.ADMIN)
  async auditoresAtivos(@UsuarioAtual() usuario: any) {
    const dados = await this.usuarioService.listarAuditoresAtivos(usuario.empresaId);
    return { sucesso: true, dados };
  }

  @Get('racs-ativos')
  @Roles(PerfilUsuario.ADMIN)
  async racsAtivos(@UsuarioAtual() usuario: any) {
    const dados = await this.usuarioService.listarRacsAtivos(usuario.empresaId);
    return { sucesso: true, dados };
  }

  @Get('empresa/:empresaId')
  @Roles(PerfilUsuario.SUPERADMIN)
  async listarPorEmpresa(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query('perfil') perfil?: PerfilUsuario,
  ) {
    const dados = await this.usuarioService.listar(empresaId, perfil);
    return { sucesso: true, dados };
  }

  @Patch(':id/resetar-senha')
  @Roles(PerfilUsuario.SUPERADMIN)
  async resetarSenha(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetarSenhaDto,
  ) {
    await this.usuarioService.resetarSenha(id, dto.senha);
    return { sucesso: true, dados: { mensagem: 'Senha redefinida com sucesso.' } };
  }

  @Patch('empresa/:empresaId/trocar-admin')
  @Roles(PerfilUsuario.SUPERADMIN)
  async trocarAdmin(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: AdminDto,
  ) {
    const dados = await this.usuarioService.trocarAdmin(empresaId, dto);
    return { sucesso: true, dados };
  }

  @Get(':id')
  async buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: any,
  ) {
    const empresaId =
      usuario.perfil === PerfilUsuario.ADMIN ? usuario.empresaId : undefined;
    const dados = await this.usuarioService.buscarPorId(id, empresaId);
    return { sucesso: true, dados };
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.usuarioService.atualizar(id, dto, usuario.id, usuario.perfil);
    return { sucesso: true, dados };
  }
}