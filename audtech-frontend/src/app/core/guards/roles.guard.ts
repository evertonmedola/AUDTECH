import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { PerfilUsuario } from '../models/enums';

export const rolesGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router    = inject(Router);

  const perfisPermitidos = route.data['roles'] as PerfilUsuario[] | undefined;

  // Sem restrição de perfil definida na rota
  if (!perfisPermitidos || perfisPermitidos.length === 0) {
    return true;
  }

  const perfilAtual = authStore.perfil();

  if (perfilAtual && perfisPermitidos.includes(perfilAtual)) {
    return true;
  }

  // Redireciona para dashboard com acesso negado
  return router.createUrlTree(['/dashboard'], {
    queryParams: { acessoNegado: true },
  });
};
