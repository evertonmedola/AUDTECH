import { Routes } from '@angular/router';

export const empresasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./empresa-list/empresa-list.component').then(m => m.EmpresaListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./empresa-form/empresa-form.component').then(m => m.EmpresaFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./empresa-form/empresa-form.component').then(m => m.EmpresaFormComponent),
  },
  {
    path: ':id/usuarios',
    loadComponent: () =>
      import('./empresa-usuarios/empresa-usuarios.component').then(m => m.EmpresaUsuariosComponent),
  },
];