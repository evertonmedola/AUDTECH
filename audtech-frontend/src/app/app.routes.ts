import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolesGuard } from './core/guards/roles.guard';
import { PerfilUsuario } from './core/models/enums';

export const routes: Routes = [
  // Redireciona raiz — authGuard decide para onde vai
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // Área pública — login
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.authRoutes),
  },

  // Área protegida — layout principal com sidenav
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        m => m.MainLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        canActivate: [rolesGuard],
        data: { roles: [PerfilUsuario.SUPERADMIN, PerfilUsuario.ADMIN, PerfilUsuario.AUDITOR, PerfilUsuario.RAC] },
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            m => m.dashboardRoutes,
          ),
      },
      {
        path: 'empresas',
        canActivate: [rolesGuard],
        data: { roles: [PerfilUsuario.SUPERADMIN] }, // só SUPERADMIN
        loadChildren: () =>
          import('./features/empresas/empresas.routes').then(
            m => m.empresasRoutes,
          ),
      },
      {
        path: 'usuarios',
        canActivate: [rolesGuard],
        data: { roles: [PerfilUsuario.ADMIN] },
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then(
            m => m.usuariosRoutes,
          ),
      },
      {
        path: 'checklist-templates',
        canActivate: [rolesGuard],
        data: { roles: [PerfilUsuario.ADMIN] },
        loadChildren: () =>
          import('./features/checklist-templates/checklist-templates.routes').then(
            m => m.checklistTemplatesRoutes,
          ),
      },
      {
        path: 'checklist-execucoes',
        loadChildren: () =>
          import('./features/checklist-execucao/checklist-execucao.routes').then(
            m => m.checklistExecucaoRoutes,
          ),
      },
      {
        path: 'planos-acao',
        loadChildren: () =>
          import('./features/plano-acao/plano-acao.routes').then(
            m => m.planoAcaoRoutes,
          ),
      },
      {
        path: 'templates-globais',
        canActivate: [rolesGuard],
        data: { roles: [PerfilUsuario.SUPERADMIN] },
        loadChildren: () =>
          import('./features/templates-globais/templates-globais.routes').then(
            m => m.templatesGlobaisRoutes,
          ),
      },
    ],
  },



  // Fallback
  { path: '**', redirectTo: 'dashboard' },
];