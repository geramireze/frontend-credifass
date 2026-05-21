import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientesStore } from '../data-access/clientes.store';
import { ClientesApiService } from '../data-access/clientes-api';
import { AuthStore } from '../../auth/data-access/auth.store';
import { PagosApiService } from '../../pagos/data-access/pagos-api';
import { CfVentasApi } from '../../credifass/cf-ventas/data-access/cf-ventas-api';
import type { MedioPago } from '../../credifass/cf-ventas/data-access/cf-ventas.model';
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
  protected readonly store      = inject(ClientesStore);
  protected readonly authStore  = inject(AuthStore);
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly api          = inject(ClientesApiService);
  private readonly pagosApi     = inject(PagosApiService);
  private readonly cfVentasApi  = inject(CfVentasApi);

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

  // ── Modal: pagar siguiente cuota ──────────────────────────────────
  protected readonly pagoModal    = signal<{ prestamo: HistorialPrestamo; montoCuota: number } | null>(null);
  protected readonly pagoMonto    = signal('');
  protected readonly pagoMedio    = signal<'efectivo' | 'transferencia' | 'otro'>('efectivo');
  protected readonly pagoLoading  = signal(false);
  protected readonly pagoError    = signal('');

  protected abrirPagoCuota(prestamo: HistorialPrestamo): void {
    const restantes = prestamo.cuotasTotales - prestamo.cuotasPagadas;
    const montoCuota = restantes > 0
      ? Math.round(Number(prestamo.saldoPendiente) / restantes)
      : Number(prestamo.saldoPendiente);
    this.pagoMonto.set(String(montoCuota));
    this.pagoMedio.set('efectivo');
    this.pagoError.set('');
    this.pagoModal.set({ prestamo, montoCuota });
  }

  protected cerrarPagoCuota(): void {
    if (!this.pagoLoading()) this.pagoModal.set(null);
  }

  protected async confirmarPagoCuota(): Promise<void> {
    const modal = this.pagoModal();
    if (!modal) return;
    const monto = Number(this.pagoMonto());
    if (!monto || monto <= 0) { this.pagoError.set('Ingresa un monto válido.'); return; }
    this.pagoLoading.set(true);
    this.pagoError.set('');
    try {
      await this.pagosApi.registrar({
        prestamo_id: modal.prestamo.id,
        monto,
        medio: this.pagoMedio(),
        idempotency_key: crypto.randomUUID(),
      });
      const clienteId = this.store.seleccionado()?.id;
      if (clienteId) {
        const [nuevos, nuevosPagos] = await Promise.all([
          this.api.historialPrestamos(clienteId).catch(() => this.prestamos()),
          this.api.pagosCliente(clienteId).catch(() => this.pagos()),
        ]);
        this.prestamos.set(nuevos);
        this.pagos.set(nuevosPagos);
        await this.store.cargarDetalle(clienteId);
      }
      this.pagoModal.set(null);
    } catch {
      this.pagoError.set('No se pudo registrar el pago. Inténtalo de nuevo.');
    } finally {
      this.pagoLoading.set(false);
    }
  }

  // ── Modal: abonar a venta ──────────────────────────────────────────
  protected readonly abonoModal   = signal<VentaCliente | null>(null);
  protected readonly abonoMonto   = signal('');
  protected readonly abonoMedio   = signal<MedioPago>('efectivo');
  protected readonly abonoLoading = signal(false);
  protected readonly abonoError   = signal('');

  protected abrirAbonoVenta(venta: VentaCliente): void {
    this.abonoMonto.set(venta.saldoPendiente);
    this.abonoMedio.set('efectivo');
    this.abonoError.set('');
    this.abonoModal.set(venta);
  }

  protected cerrarAbonoVenta(): void {
    if (!this.abonoLoading()) this.abonoModal.set(null);
  }

  protected async confirmarAbonoVenta(): Promise<void> {
    const venta = this.abonoModal();
    if (!venta) return;
    const monto = Number(this.abonoMonto());
    if (!monto || monto <= 0) { this.abonoError.set('Ingresa un monto válido.'); return; }
    this.abonoLoading.set(true);
    this.abonoError.set('');
    try {
      await this.cfVentasApi.registrarAbono(
        venta.id,
        { monto: String(monto), medioPago: this.abonoMedio() },
        crypto.randomUUID(),
      );
      const clienteId = this.store.seleccionado()?.id;
      if (clienteId) {
        this.ventas.set(await this.api.ventas(clienteId).catch(() => this.ventas()));
        await this.store.cargarDetalle(clienteId);
      }
      this.abonoModal.set(null);
    } catch {
      this.abonoError.set('No se pudo registrar el abono. Inténtalo de nuevo.');
    } finally {
      this.abonoLoading.set(false);
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────
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
