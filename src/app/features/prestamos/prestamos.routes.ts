import { Routes } from '@angular/router';

export const PRESTAMOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-prestamos/feature-prestamos').then((m) => m.FeaturePrestamos),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./feature-prestamo-form/feature-prestamo-form').then((m) => m.FeaturePrestamoForm),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./feature-prestamo-detalle/feature-prestamo-detalle').then((m) => m.FeaturePrestamoDetalle),
  },
];
