import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
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

const TITULO_FILTRO: Record<string, string> = {
  al_dia:               'Clientes al día',
  pendiente_por_vencer: 'Clientes por vencer',
  en_mora:              'Clientes en mora',
  inactivo:             'Clientes inactivos',
  sin_prestamos:        'Clientes sin préstamos',
};

@Component({
  selector: 'app-feature-clientes',
  imports: [RouterLink, CopPipe, AppIconComponent],
  templateUrl: './feature-clientes.html',
  styleUrl: './feature-clientes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureClientes implements OnInit, OnDestroy {
  protected readonly store     = inject(ClientesStore);
  protected readonly authStore = inject(AuthStore);
  private  readonly route      = inject(ActivatedRoute);

  protected readonly busqueda     = signal('');
  protected readonly filtroEstado = signal('');

  protected readonly tituloHeader = computed(() =>
    TITULO_FILTRO[this.filtroEstado()] ?? 'Clientes'
  );

  protected readonly subHeader = 'Gestión de clientes del sistema';

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const estadoParam = this.route.snapshot.queryParamMap.get('estado') ?? '';
    this.filtroEstado.set(estadoParam);
    this.store.buscar('', estadoParam);
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  protected onInputBusqueda(valor: string): void {
    this.busqueda.set(valor);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.onBuscar(), 350);
  }

  protected onBuscar(): void {
    this.store.buscar(this.busqueda(), this.filtroEstado());
  }

  protected onEstadoChange(estado: string): void {
    this.filtroEstado.set(estado);
    this.onBuscar();
  }

  protected paginarNext(): void {
    const next = this.store.page() + 1;
    const total = Math.ceil(this.store.total() / this.store.pageSize());
    if (next <= total) this.store.cambiarPagina(next);
  }

  protected paginarPrev(): void {
    const prev = this.store.page() - 1;
    if (prev >= 1) this.store.cambiarPagina(prev);
  }

  protected puedeCriar(): boolean {
    const rol = this.authStore.rol();
    return rol === 'admin' || rol === 'supervisor';
  }

  protected estadoLabel(estado: string): string {
    return ESTADO_LABELS[estado as EstadoCliente] ?? estado;
  }

  protected estadoBadge(estado: string): string {
    return ESTADO_BADGE[estado as EstadoCliente] ?? 'badge';
  }

  protected totalPages(): number {
    return Math.ceil(this.store.total() / this.store.pageSize());
  }

  protected rangeStart(): number {
    return (this.store.page() - 1) * this.store.pageSize() + 1;
  }

  protected rangeEnd(): number {
    return Math.min(this.store.page() * this.store.pageSize(), this.store.total());
  }
}
