import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ChecklistTemplateService } from './checklist-template.service';
import {
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
} from './dto/create-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checklist-templates')
export class ChecklistTemplateController {
  constructor(private readonly service: ChecklistTemplateService) { }

  // ── SUPERADMIN — templates globais ────────────────────────────────────────

  @Post('global')
  @Roles(PerfilUsuario.SUPERADMIN)
  async criarGlobal(@Body() dto: CreateChecklistTemplateDto) {
    const dados = await this.service.criar(dto, null, true);
    return { sucesso: true, dados };
  }

  @Get('global')
  @Roles(PerfilUsuario.SUPERADMIN)
  async listarGlobais() {
    const dados = await this.service.listarGlobais();
    return { sucesso: true, dados };
  }

  @Patch('global/:id')
  @Roles(PerfilUsuario.SUPERADMIN)
  async atualizarGlobal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChecklistTemplateDto,
  ) {
    const dados = await this.service.atualizar(id, dto, null);
    return { sucesso: true, dados };
  }

  @Delete('global/:id')
  @Roles(PerfilUsuario.SUPERADMIN)
  async inativarGlobal(@Param('id', ParseIntPipe) id: number) {
    const dados = await this.service.inativar(id, null);
    return { sucesso: true, dados };
  }

  // ── ADMIN — templates da empresa ──────────────────────────────────────────

  @Post()
  @Roles(PerfilUsuario.ADMIN)
  async criar(@Body() dto: CreateChecklistTemplateDto, @UsuarioAtual() usuario: any) {
    const dados = await this.service.criar(dto, usuario.empresaId);
    return { sucesso: true, dados };
  }

  @Get()
  @Roles(PerfilUsuario.ADMIN)
  async listar(@UsuarioAtual() usuario: any) {
    const dados = await this.service.listar(usuario.empresaId);
    return { sucesso: true, dados };
  }

  @Get('ativos')
  async listarAtivos(@UsuarioAtual() usuario: any) {
    const dados = await this.service.listarAtivos(usuario.empresaId);
    return { sucesso: true, dados };
  }

  @Get(':id')
  async buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.buscarPorId(id, usuario.empresaId);
    return { sucesso: true, dados };
  }

  @Patch(':id')
  @Roles(PerfilUsuario.ADMIN)
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChecklistTemplateDto,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.atualizar(id, dto, usuario.empresaId);
    return { sucesso: true, dados };
  }

  @Delete(':id')
  @Roles(PerfilUsuario.ADMIN)
  async inativar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.inativar(id, usuario.empresaId);
    return { sucesso: true, dados };
  }
}