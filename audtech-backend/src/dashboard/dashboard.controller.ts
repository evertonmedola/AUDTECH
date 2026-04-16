import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { PerfilUsuario } from '../common/enums/perfil-usuario.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get()
  async getDados(@UsuarioAtual() usuario: any) {
    const dados = await this.dashboardService.getDados(
      usuario.id,
      usuario.perfil,
      usuario.empresaId,
    );
    return { sucesso: true, dados };
  }

  @Get('superadmin')
  @Roles(PerfilUsuario.SUPERADMIN)
  async getDadosSuperAdmin() {
    const dados = await this.dashboardService.getDadosSuperAdmin();
    return { sucesso: true, dados };
  }
}