import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-clientes/feature-clientes').then((m) => m.FeatureClientes),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./feature-cliente-form/feature-cliente-form').then((m) => m.FeatureClienteForm),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./feature-cliente-detalle/feature-cliente-detalle').then((m) => m.FeatureClienteDetalle),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./feature-cliente-form/feature-cliente-form').then((m) => m.FeatureClienteForm),
  },
];
