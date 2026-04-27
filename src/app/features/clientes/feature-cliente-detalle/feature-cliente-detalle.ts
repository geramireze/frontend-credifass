import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientesStore } from '../data-access/clientes.store';
import { AuthStore } from '../../auth/data-access/auth.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { EstadoCliente } from '../data-access/clientes.model';

const ESTADO_LABELS: Record<EstadoCliente, string> = {
  al_dia: 'Al día',
  pendiente_por_vencer: 'Por vencer',
  en_mora: 'En mora',
  inactivo: 'Inactivo',
  sin_prestamos: 'Sin préstamos',
};

const ESTADO_BADGE: Record<EstadoCliente, string> = {
  al_dia: 'badge badge-success',
  pendiente_por_vencer: 'badge badge-pendiente',
  en_mora: 'badge badge-mora',
  inactivo: 'badge',
  sin_prestamos: 'badge',
};

@Component({
  selector: 'app-feature-cliente-detalle',
  imports: [RouterLink, CopPipe, AppIconComponent],
  templateUrl: './feature-cliente-detalle.html',
  styleUrl: './feature-cliente-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureClienteDetalle implements OnInit, OnDestroy {
  protected readonly store = inject(ClientesStore);
  protected readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly estadoLabels = ESTADO_LABELS;
  protected readonly tabActivo = signal<'datos' | 'prestamos' | 'referencias' | 'pagos' | 'auditoria'>('datos');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.cargarDetalle(id);
  }

  ngOnDestroy(): void {
    this.store.limpiarSeleccionado();
  }

  protected estadoLabel(estado: string): string {
    return ESTADO_LABELS[estado as EstadoCliente] ?? estado;
  }

  protected estadoBadge(estado: string): string {
    return ESTADO_BADGE[estado as EstadoCliente] ?? 'badge';
  }

  protected puedeEditar(): boolean {
    const rol = this.authStore.rol();
    return rol === 'admin' || rol === 'supervisor';
  }

  protected verPrestamos(): void {
    const id = this.store.seleccionado()?.id;
    if (id) this.router.navigate(['/prestamos'], { queryParams: { cliente_id: id } });
  }

  protected nuevoPrestamo(): void {
    const id = this.store.seleccionado()?.id;
    if (id) this.router.navigate(['/prestamos', 'nuevo'], { queryParams: { cliente_id: id } });
  }
}
