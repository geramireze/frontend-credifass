import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientesStore } from '../data-access/clientes.store';
import { ClientesApiService } from '../data-access/clientes-api';
import { AuthStore } from '../../auth/data-access/auth.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { EstadoCliente, CompraProducto, HistorialPrestamo, VentaCliente, PagoCliente } from '../data-access/clientes.model';

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
  imports: [RouterLink, CopPipe, AppIconComponent, TitleCasePipe, DatePipe],
  templateUrl: './feature-cliente-detalle.html',
  styleUrl: './feature-cliente-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureClienteDetalle implements OnInit, OnDestroy {
  protected readonly store = inject(ClientesStore);
  protected readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ClientesApiService);

  protected readonly estadoLabels = ESTADO_LABELS;
  protected readonly tabActivo = signal<'datos' | 'prestamos' | 'referencias' | 'pagos' | 'compras' | 'auditoria'>('datos');

  protected readonly prestamos = signal<HistorialPrestamo[]>([]);
  protected readonly prestamosLoading = signal(false);

  protected readonly ventas = signal<VentaCliente[]>([]);
  protected readonly ventasLoading = signal(false);
  protected readonly totalVentasMonto = computed(() => this.ventas().reduce((s, v) => s + Number(v.subtotalVenta), 0));
  protected readonly totalVentasSaldo = computed(() => this.ventas().reduce((s, v) => s + Number(v.saldoPendiente), 0));

  protected readonly pagos = signal<PagoCliente[]>([]);
  protected readonly pagosLoading = signal(false);
  protected readonly pagosDePrestamo = computed(() => this.pagos().filter(p => p.tipo === 'prestamo'));
  protected readonly totalPagadoPrestamos = computed(() =>
    this.pagosDePrestamo().filter(p => !p.anulado).reduce((s, p) => s + Number(p.monto), 0));
  protected readonly totalPagadoMercancia = computed(() =>
    this.pagos().filter(p => p.tipo === 'mercancia' && !p.anulado).reduce((s, p) => s + Number(p.monto), 0));

  protected readonly compras = signal<CompraProducto[]>([]);
  protected readonly comprasLoading = signal(false);
  protected readonly totalCompras = computed(() => this.compras().reduce((s, c) => s + c.totalCantidad, 0));
  protected readonly totalGastado = computed(() => this.compras().reduce((s, c) => s + Number(c.totalGastado), 0));

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

  protected async setTab(tab: 'datos' | 'prestamos' | 'referencias' | 'pagos' | 'compras' | 'auditoria'): Promise<void> {
    this.tabActivo.set(tab);
    const id = this.store.seleccionado()?.id;
    if (!id) return;

    if (tab === 'prestamos') {
      const loads: Promise<void>[] = [];
      if (this.prestamos().length === 0) {
        loads.push(
          this.api.historialPrestamos(id).catch(() => []).then(r => this.prestamos.set(r)),
        );
      }
      if (this.pagos().length === 0) {
        loads.push(
          this.api.pagosCliente(id).catch(() => []).then(r => this.pagos.set(r)),
        );
      }
      if (loads.length) {
        this.prestamosLoading.set(true);
        await Promise.all(loads);
        this.prestamosLoading.set(false);
      }
    }

    if (tab === 'pagos' && this.pagos().length === 0) {
      this.pagosLoading.set(true);
      this.pagos.set(await this.api.pagosCliente(id).catch(() => []));
      this.pagosLoading.set(false);
    }

    if (tab === 'compras' && this.ventas().length === 0) {
      this.ventasLoading.set(true);
      this.ventas.set(await this.api.ventas(id).catch(() => []));
      this.ventasLoading.set(false);
    }
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

  protected prestamoBadge(estado: string): string {
    const map: Record<string, string> = {
      al_dia: 'badge badge-success',
      pendiente_por_vencer: 'badge badge-pendiente',
      en_mora: 'badge badge-mora',
      pagado: 'badge badge-success',
      cancelado: 'badge',
    };
    return map[estado] ?? 'badge';
  }

  protected ventaBadge(estado: string): string {
    const map: Record<string, string> = {
      activa: 'badge badge-success',
      pagada: 'badge badge-success',
      vencida: 'badge badge-mora',
      cancelada: 'badge',
    };
    return map[estado] ?? 'badge';
  }

  protected tipoVentaLabel(tipo: string): string {
    const map: Record<string, string> = { contado: 'Contado', cuotas: 'Cuotas', abono: 'Abono' };
    return map[tipo] ?? tipo;
  }

  protected async onReactivar(): Promise<void> {
    const id = this.store.seleccionado()?.id;
    if (id) await this.store.reactivar(id);
  }
}
