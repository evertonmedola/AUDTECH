import { Routes } from '@angular/router';
import { rolesGuard } from '../../core/guards/roles.guard';
import { PerfilUsuario } from '../../core/models/enums';

export const checklistExecucaoRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./execucao-list/execucao-list.component').then(m => m.ExecucaoListComponent),
  },
  {
    path: 'nova',
    canActivate: [rolesGuard],
    data: { roles: [PerfilUsuario.ADMIN] },
    loadComponent: () =>
      import('./execucao-form/execucao-form.component').then(m => m.ExecucaoFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./execucao-detail/execucao-detail.component').then(m => m.ExecucaoDetailComponent),
  },
];
