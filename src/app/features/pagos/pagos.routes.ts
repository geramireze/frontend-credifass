import { Routes } from '@angular/router';

export const PAGOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-pagos/feature-pagos').then((m) => m.FeaturePagos),
  },
];
