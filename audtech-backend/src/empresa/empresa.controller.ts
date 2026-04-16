import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/create-empresa.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';
import { UsuarioService } from '../usuario/usuario.service';
import { CriarEmpresaComAdminDto } from '../usuario/dto/criar-empresa-com-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresas')
export class EmpresaController {
  constructor(
    private readonly empresaService: EmpresaService,
    private readonly usuarioService: UsuarioService,
  ) { }

  @Post('com-admin')
  @Roles(PerfilUsuario.SUPERADMIN)
  async criarComAdmin(@Body() dto: CriarEmpresaComAdminDto) {
    const dados = await this.usuarioService.criarEmpresaComAdmin(dto);
    return { sucesso: true, dados };
  }

  @Post()
  @Roles(PerfilUsuario.SUPERADMIN)
  async criar(@Body() dto: CreateEmpresaDto) {
    const dados = await this.empresaService.criar(dto);
    return { sucesso: true, dados };
  }

  @Get()
  @Roles(PerfilUsuario.SUPERADMIN)
  async listar() {
    const dados = await this.empresaService.listar();
    return { sucesso: true, dados };
  }

  @Get(':id')
  @Roles(PerfilUsuario.SUPERADMIN)
  async buscar(@Param('id', ParseIntPipe) id: number) {
    const dados = await this.empresaService.buscarPorId(id);
    return { sucesso: true, dados };
  }

  @Patch(':id')
  @Roles(PerfilUsuario.SUPERADMIN)
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
  ) {
    const dados = await this.empresaService.atualizar(id, dto);
    return { sucesso: true, dados };
  }

  @Delete(':id')
  @Roles(PerfilUsuario.SUPERADMIN)
  async inativar(@Param('id', ParseIntPipe) id: number) {
    const dados = await this.empresaService.inativar(id);
    return { sucesso: true, dados };
  }
}