import { Routes } from '@angular/router';

export const checklistTemplatesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./template-list/template-list.component').then(m => m.TemplateListComponent),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./template-form/template-form.component').then(m => m.TemplateFormComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./template-form/template-form.component').then(m => m.TemplateFormComponent),
  },
];
