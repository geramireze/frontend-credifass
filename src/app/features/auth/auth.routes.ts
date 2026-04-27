import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./feature-login/feature-login').then((m) => m.FeatureLogin),
  },
  {
    path: 'olvide-contrasena',
    loadComponent: () =>
      import('./feature-forgot-password/feature-forgot-password').then(
        (m) => m.FeatureForgotPassword,
      ),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
