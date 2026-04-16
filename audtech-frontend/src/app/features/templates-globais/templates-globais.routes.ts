import { Routes } from '@angular/router';

export const templatesGlobaisRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./templates-globais-list.component').then(
        m => m.TemplateGlobalListComponent,
      ),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./templates-globais-form.component').then(
        m => m.TemplateGlobalFormComponent,
      ),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./templates-globais-form.component').then(
        m => m.TemplateGlobalFormComponent,
      ),
  },
];