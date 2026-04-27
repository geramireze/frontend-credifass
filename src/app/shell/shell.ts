import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  { path: '/auditoria',  icon: 'shield-check',     label: 'Auditoría',  roles: ['admin'] },
  { path: '/usuarios',   icon: 'user-cog',         label: 'Usuarios',   roles: ['admin'] },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppIconComponent],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly store    = inject(AuthStore);
  protected readonly navItems  = NAV_ITEMS;
  protected readonly collapsed = signal(false);

  protected readonly mobileNavItems = computed(() =>
    this.navItems.filter(item => this.puedeVer(item)).slice(0, 5),
  );

  protected puedeVer(item: NavItem): boolean {
    if (!item.roles) return true;
    const rol = this.store.rol();
    return rol !== null && item.roles.includes(rol as 'admin' | 'supervisor' | 'cobrador');
  }

  protected async cerrarSesion(): Promise<void> {
    await this.store.logout();
  }
}
