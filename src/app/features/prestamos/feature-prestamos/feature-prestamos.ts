import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrestamosStore } from '../data-access/prestamos.store';
import { PrestamosApiService } from '../data-access/prestamos-api';
import { PagosApiService } from '../../pagos/data-access/pagos-api';
import { AuthStore } from '../../auth/data-access/auth.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { EstadoPrestamo, FrecuenciaPago, PrestamoListItem } from '../data-access/prestamos.model';

const ESTADO_LABELS: Record<EstadoPrestamo, string> = {
  al_dia: 'Al día',
  pendiente_por_vencer: 'Por vencer',
  en_mora: 'En mora',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
};

const ESTADO_BADGE: Record<EstadoPrestamo, string> = {
  al_dia: 'badge badge-success',
  pendiente_por_vencer: 'badge badge-pendiente',
  en_mora: 'badge badge-mora',
  pagado: 'badge badge-pagado',
  cancelado: 'badge badge-cancelado',
};

@Component({
  selector: 'app-feature-prestamos',
  imports: [RouterLink, FormsModule, CopPipe, AppIconComponent],
  templateUrl: './feature-prestamos.html',
  styleUrl: './feature-prestamos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePrestamos implements OnInit {
  protected readonly String    = String;
  protected readonly store     = inject(PrestamosStore);
  protected readonly authStore = inject(AuthStore);
  private   readonly api       = inject(PrestamosApiService);
  private   readonly pagosApi  = inject(PagosApiService);

  protected readonly frecuenciaFiltro = signal<FrecuenciaPago | ''>('');

  protected readonly prestamosFiltrados = computed(() => {
    const f = this.frecuenciaFiltro();
    return f ? this.store.items().filter(p => p.frecuencia_pago === f) : this.store.items();
  });

  ngOnInit(): void {
    this.store.cargarLista();
  }

  protected paginarNext(): void {
    const next = this.store.page() + 1;
    const total = Math.ceil(this.store.total() / this.store.pageSize());
    if (next <= total) this.store.cambiarPagina?.(next);
  }

  protected paginarPrev(): void {
    const prev = this.store.page() - 1;
    if (prev >= 1) this.store.cambiarPagina?.(prev);
  }

  protected estadoLabel(estado: string): string {
    return ESTADO_LABELS[estado as EstadoPrestamo] ?? estado;
  }

  protected estadoBadge(estado: string): string {
    return ESTADO_BADGE[estado as EstadoPrestamo] ?? 'badge';
  }

  protected puedeCriar(): boolean {
    const rol = this.authStore.rol();
    return rol === 'admin' || rol === 'supervisor';
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

  protected cuotasLabel(pagadas: number, total: number): string {
    return `${pagadas ?? 0}/${total}`;
  }

  protected formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('T')[0].split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d} ${meses[Number(m) - 1]} ${y}`;
  }

  // ── Modal de pago rápido ──────────────────────────────────────────────────
  protected readonly pagoModal   = signal<PrestamoListItem | null>(null);
  protected readonly pagoMonto   = signal('');
  protected readonly pagoMedio   = signal<'efectivo' | 'transferencia' | 'otro'>('efectivo');
  protected readonly pagoLoading = signal(false);
  protected readonly pagoError   = signal<string | null>(null);
  protected readonly pagoExito   = signal(false);

  protected readonly mediosPago = [
    { value: 'efectivo'      as const, label: 'Efectivo' },
    { value: 'transferencia' as const, label: 'Transferencia' },
    { value: 'otro'          as const, label: 'Otro' },
  ];

  protected abrirPago(prestamo: PrestamoListItem): void {
    const monto = prestamo.cuota_semanal + (prestamo.mora_acumulada ?? 0);
    this.pagoMonto.set(String(Math.round(monto)));
    this.pagoMedio.set('efectivo');
    this.pagoError.set(null);
    this.pagoExito.set(false);
    this.pagoModal.set(prestamo);
  }

  protected cerrarPago(): void {
    if (!this.pagoLoading()) this.pagoModal.set(null);
  }

  protected async confirmarPago(): Promise<void> {
    const p = this.pagoModal();
    if (!p || this.pagoLoading()) return;
    const monto = Number(this.pagoMonto());
    if (!monto || monto <= 0) { this.pagoError.set('Ingresa un monto válido.'); return; }

    this.pagoLoading.set(true);
    this.pagoError.set(null);

    try {
      await this.pagosApi.registrar({
        prestamo_id:     p.id,
        monto,
        medio:           this.pagoMedio(),
        idempotency_key: crypto.randomUUID(),
      });
      this.pagoExito.set(true);
      this.pagoModal.set(null);
      await this.store.cargarLista();
    } catch {
      this.pagoError.set('No se pudo registrar el pago. Inténtalo de nuevo.');
    } finally {
      this.pagoLoading.set(false);
    }
  }
}
