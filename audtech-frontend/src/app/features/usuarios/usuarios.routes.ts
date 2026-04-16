import { Routes } from '@angular/router';

export const usuariosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./usuario-list/usuario-list.component').then(m => m.UsuarioListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent),
  },
];
