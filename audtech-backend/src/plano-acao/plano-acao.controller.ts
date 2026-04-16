import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlanoAcaoService } from './plano-acao.service';
import { UpdateAcaoCorretivaDto } from './dto/update-acao-corretiva.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';
import { multerEvidenciaConfig } from '../upload/upload.config';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('planos-acao')
export class PlanoAcaoController {
  constructor(private readonly service: PlanoAcaoService) { }

  @Get()
  async listar(@UsuarioAtual() usuario: any) {
    const dados = await this.service.listarPorEmpresa(
      usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Get('execucao/:execucaoId')
  async buscarPorExecucao(
    @Param('execucaoId', ParseIntPipe) execucaoId: number,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.buscarPorExecucao(
      execucaoId, usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Patch('acoes/:acaoId')
  @Roles(PerfilUsuario.ADMIN, PerfilUsuario.RAC)
  async atualizarAcao(
    @Param('acaoId', ParseIntPipe) acaoId: number,
    @Body() dto: UpdateAcaoCorretivaDto,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.atualizarAcao(
      acaoId, dto, usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Post('acoes/:acaoId/evidencias')
  @Roles(PerfilUsuario.ADMIN, PerfilUsuario.RAC)
  @UseInterceptors(FileInterceptor('arquivo', multerEvidenciaConfig))
  async adicionarEvidencia(
    @Param('acaoId', ParseIntPipe) acaoId: number,
    @UploadedFile() arquivo: Express.Multer.File,
    @UsuarioAtual() usuario: any,
  ) {
    const dados = await this.service.adicionarEvidencia(
      acaoId, arquivo, usuario.id, usuario.perfil, usuario.empresaId,
    );
    return { sucesso: true, dados };
  }
}
