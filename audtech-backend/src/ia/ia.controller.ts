import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IaService } from './ia.service';
import { GerarChecklistDto } from './dto/gerar-checklist.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('gerar-checklist')
  @Roles(PerfilUsuario.ADMIN, PerfilUsuario.SUPERADMIN)
  async gerarChecklist(@Body() dto: GerarChecklistDto) {
    const dados = await this.iaService.gerarChecklist(dto.descricao);
    return { sucesso: true, dados };
  }
}
