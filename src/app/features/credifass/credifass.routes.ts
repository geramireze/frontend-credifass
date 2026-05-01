import { Routes } from '@angular/router';

export const CREDIFASS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./cf-productos/feature-cf-productos/feature-cf-productos').then(
        (m) => m.FeatureCfProductos,
      ),
  },
  {
    path: 'productos/nuevo',
    loadComponent: () =>
      import('./cf-productos/feature-cf-producto-form/feature-cf-producto-form').then(
        (m) => m.FeatureCfProductoForm,
      ),
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./cf-clientes/feature-cf-clientes/feature-cf-clientes').then(
        (m) => m.FeatureCfClientes,
      ),
  },
  {
    path: 'clientes/nuevo',
    loadComponent: () =>
      import('./cf-clientes/feature-cf-cliente-form/feature-cf-cliente-form').then(
        (m) => m.FeatureCfClienteForm,
      ),
  },
  {
    path: 'clientes/:id/editar',
    loadComponent: () =>
      import('./cf-clientes/feature-cf-cliente-form/feature-cf-cliente-form').then(
        (m) => m.FeatureCfClienteForm,
      ),
  },
  {
    path: 'ventas',
    loadComponent: () =>
      import('./cf-ventas/feature-cf-ventas/feature-cf-ventas').then(
        (m) => m.FeatureCfVentas,
      ),
  },
  {
    path: 'ventas/nueva',
    loadComponent: () =>
      import('./cf-ventas/feature-cf-venta-form/feature-cf-venta-form').then(
        (m) => m.FeatureCfVentaForm,
      ),
  },
  {
    path: 'ventas/:id',
    loadComponent: () =>
      import('./cf-ventas/feature-cf-venta-detalle/feature-cf-venta-detalle').then(
        (m) => m.FeatureCfVentaDetalle,
      ),
  },
  {
    path: 'reservas',
    loadComponent: () =>
      import('./cf-reservas/feature-cf-reservas/feature-cf-reservas').then(
        (m) => m.FeatureCfReservas,
      ),
  },
  {
    path: 'reservas/nueva',
    loadComponent: () =>
      import('./cf-reservas/feature-cf-reserva-form/feature-cf-reserva-form').then(
        (m) => m.FeatureCfReservaForm,
      ),
  },
];
