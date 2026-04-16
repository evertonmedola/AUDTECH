import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../usuario/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { Status } from '../common/enums/status.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) { }

  async login(dto: LoginDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { email: dto.email },
      relations: { empresa: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (usuario.status !== Status.ATIVO) {
      throw new ForbiddenException(
        'Usuário inativo. Contate o administrador.',
      );
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    console.log("Senha digitada:", dto.senha);
    console.log("Hash banco:", usuario.senhaHash);
    console.log("Tipo hash:", typeof usuario.senhaHash);
    console.log("Resultado compare:", senhaValida);
    console.log('Usuario encontrado:', usuario?.email, usuario?.perfil);

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      empresaId: usuario.empresaId ?? null,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        empresaId: usuario.empresaId,
        nomeEmpresa: usuario.empresa?.razaoSocial,
      },
    };
  }

  async perfil(userId: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId },
      select: ['id', 'nome', 'email', 'perfil', 'status', 'empresaId'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return usuario;
  }
}
