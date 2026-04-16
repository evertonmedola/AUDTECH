import { Routes } from '@angular/router';

export const planoAcaoRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./plano-list/plano-list.component').then(m => m.PlanoListComponent),
  },
  {
    path: 'execucao/:execucaoId',
    loadComponent: () =>
      import('./plano-detail/plano-detail.component').then(m => m.PlanoDetailComponent),
  },
];
