import { Routes } from '@angular/router';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-reportes/feature-reportes').then((m) => m.FeatureReportes),
  },
];
