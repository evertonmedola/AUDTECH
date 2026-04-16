import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * POST /api/v1/auth/login
   * Autentica o usuário e retorna o JWT
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const dados = await this.authService.login(dto);
    return { sucesso: true, dados };
  }

  /**
   * GET /api/v1/auth/me
   * Retorna os dados do usuário autenticado pelo token
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@UsuarioAtual() usuario: any) {
    const dados = await this.authService.perfil(usuario.id);
    return { sucesso: true, dados };
  }
}
