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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChecklistExecucaoService } from './checklist-execucao.service';
import {
  CreateExecucaoDto,
  UpdateItemExecucaoDto,
  CreatePendenciaDto,
  CreateNaoConformidadeDto,
  AssinarChecklistDto,
} from './dto/create-execucao.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';
import { multerEvidenciaConfig } from '../upload/upload.config';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checklist-execucoes')
export class ChecklistExecucaoController {
  constructor(private readonly service: ChecklistExecucaoService) { }

  @Post()
  @Roles(PerfilUsuario.ADMIN)
  async criar(@Body() dto: CreateExecucaoDto, @UsuarioAtual() usuario: any) {
    const dados = await this.service.criar(dto, usuario.empresaId);
    return { sucesso: true, dados };
  }

  @Get()
  async listar(@UsuarioAtual() usuario: any) {
    const dados = await this.service.listar(usuario.id, usuario.perfil, usuario.empresaId);
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

  @Patch(':id/itens/:itemId')
  @Roles(PerfilUsuario.AUDITOR, PerfilUsuario.ADMIN)
  async atualizarItem(
    @Param('id', ParseIntPipe) execucaoId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateItemExecucaoDto,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.atualizarItem(
      execucaoId, itemId, dto, usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Post(':id/itens/:itemId/evidencias')
  @Roles(PerfilUsuario.AUDITOR, PerfilUsuario.ADMIN)
  @UseInterceptors(FileInterceptor('arquivo', multerEvidenciaConfig))
  async adicionarEvidencia(
    @Param('id', ParseIntPipe) execucaoId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @UploadedFile() arquivo: Express.Multer.File,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.adicionarEvidencia(
      execucaoId, itemId, arquivo, usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Delete('evidencias/:evidenciaId')
  @Roles(PerfilUsuario.AUDITOR, PerfilUsuario.ADMIN)
  async removerEvidencia(
    @Param('evidenciaId', ParseIntPipe) evidenciaId: number,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.removerEvidencia(
      evidenciaId, usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Post(':id/itens/:itemId/pendencias')
  @Roles(PerfilUsuario.AUDITOR, PerfilUsuario.ADMIN)
  async adicionarPendencia(
    @Param('id', ParseIntPipe) execucaoId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: CreatePendenciaDto,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.adicionarPendencia(
      execucaoId, itemId, dto, usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Post(':id/itens/:itemId/nao-conformidades')
  @Roles(PerfilUsuario.AUDITOR, PerfilUsuario.ADMIN)
  async adicionarNaoConformidade(
    @Param('id', ParseIntPipe) execucaoId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: CreateNaoConformidadeDto,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.adicionarNaoConformidade(
      execucaoId, itemId, dto, usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Post(':id/assinar')
  @Roles(PerfilUsuario.AUDITOR, PerfilUsuario.ADMIN)
  async assinar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssinarChecklistDto,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.assinar(id, dto, usuario, usuario.empresaId);
    return { sucesso: true, dados };
  }
}