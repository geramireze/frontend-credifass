import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-usuarios/feature-usuarios').then((m) => m.FeatureUsuarios),
  },
];
