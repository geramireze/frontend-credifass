import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () => import('./shell/shell').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/feature-dashboard/feature-dashboard').then(
            (m) => m.FeatureDashboard,
          ),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./features/clientes/clientes.routes').then((m) => m.CLIENTES_ROUTES),
      },
      {
        path: 'prestamos',
        loadChildren: () =>
          import('./features/prestamos/prestamos.routes').then((m) => m.PRESTAMOS_ROUTES),
      },
      {
        path: 'pagos',
        loadChildren: () =>
          import('./features/pagos/pagos.routes').then((m) => m.PAGOS_ROUTES),
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'exportacion',
        loadComponent: () =>
          import('./features/exportacion/feature-exportacion/feature-exportacion').then(
            (m) => m.FeatureExportacion,
          ),
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./features/auditoria/feature-auditoria/feature-auditoria').then(
            (m) => m.FeatureAuditoria,
          ),
      },
      {
        path: 'credifass',
        loadChildren: () =>
          import('./features/credifass/credifass.routes').then((m) => m.CREDIFASS_ROUTES),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/feature-login/feature-login').then((m) => m.FeatureLogin),
  },
  {
    path: 'olvide-contrasena',
    loadComponent: () =>
      import('./features/auth/feature-forgot-password/feature-forgot-password').then(
        (m) => m.FeatureForgotPassword,
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
