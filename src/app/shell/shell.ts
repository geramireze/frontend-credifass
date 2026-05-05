import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../features/auth/data-access/auth.store';
import { AppIconComponent } from '../shared/components/icon/icon';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  mobileLabel?: string;
  roles?: ('admin' | 'supervisor' | 'cobrador')[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',  icon: 'layout-dashboard', label: 'Dashboard',  mobileLabel: 'Inicio' },
  { path: '/clientes',   icon: 'users',            label: 'Clientes',   roles: ['admin', 'supervisor'] },
  { path: '/prestamos',  icon: 'wallet',           label: 'Préstamos',  roles: ['admin', 'supervisor'] },
  { path: '/pagos',      icon: 'hand-coins',       label: 'Cobranza',   mobileLabel: 'Ruta' },
  { path: '/reportes',   icon: 'bar-chart',        label: 'Reportes',   roles: ['admin', 'supervisor'] },
  { path: '/cierres',    icon: 'calendar-check',   label: 'Cierres',    roles: ['admin', 'supervisor'] },
  { path: '/auditoria',  icon: 'shield-check',     label: 'Auditoría',  roles: ['admin'] },
  { path: '/usuarios',   icon: 'user-cog',         label: 'Usuarios',   roles: ['admin'] },
];

const CF_NAV_ITEMS: NavItem[] = [
  { path: '/credifass/productos', icon: 'package',       label: 'Inventario',   mobileLabel: 'Invent.', roles: ['admin', 'supervisor'] },
  { path: '/credifass/ventas',    icon: 'shopping-cart', label: 'Ventas CF',    mobileLabel: 'Ventas' },
  { path: '/credifass/reservas',  icon: 'bookmark',      label: 'Reservas CF',  mobileLabel: 'Reservas' },
  { path: '/credifass/reportes',  icon: 'bar-chart-2',   label: 'Reportes CF',  mobileLabel: 'Rpt.CF', roles: ['admin', 'supervisor'] },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppIconComponent],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly store      = inject(AuthStore);
  protected readonly navItems   = NAV_ITEMS;
  protected readonly cfNavItems = CF_NAV_ITEMS;
  protected readonly collapsed  = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mobileNavItems = computed(() =>
    [...this.navItems, ...this.cfNavItems].filter(item => this.puedeVer(item)).slice(0, 4),
  );

  constructor() {
    // Cierra el drawer cuando el usuario navega a otra ruta
    this.router.events.pipe(
      filter(e => e instanceof NavigationStart),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.mobileMenuOpen.set(false));

    // Bloquea el scroll del body cuando el drawer está abierto
    effect(() => {
      document.body.style.overflow = this.mobileMenuOpen() ? 'hidden' : '';
    });
  }

  protected puedeVer(item: NavItem): boolean {
    if (!item.roles) return true;
    const rol = this.store.rol();
    return rol !== null && item.roles.includes(rol as 'admin' | 'supervisor' | 'cobrador');
  }

  protected async cerrarSesion(): Promise<void> {
    this.mobileMenuOpen.set(false);
    await this.store.logout();
  }
}
