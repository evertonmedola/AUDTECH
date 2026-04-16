import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PerfilUsuario } from '../enums/perfil-usuario.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PerfilUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const { user } = context.switchToHttp().getRequest();

    // SUPERADMIN passa por qualquer rota autenticada
    if (user?.perfil === PerfilUsuario.SUPERADMIN) {
      return true;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user || !requiredRoles.includes(user.perfil)) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    return true;
  }
}
