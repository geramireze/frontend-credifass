import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfVentasStore } from '../data-access/cf-ventas.store';
import { CfVentasApi } from '../data-access/cf-ventas-api';
import type { CfVenta, EstadoVenta, MedioPago, TipoVenta } from '../data-access/cf-ventas.model';

@Component({
  selector: 'app-feature-cf-ventas',
  imports: [RouterLink, FormsModule, CopPipe, DatePipe],
  templateUrl: './feature-cf-ventas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfVentas implements OnInit {
  protected readonly String = String;
  protected readonly store  = inject(CfVentasStore);
  private  readonly api     = inject(CfVentasApi);
  protected busqueda    = signal('');
  protected estadoFiltro = signal<EstadoVenta | ''>('');
  protected tipoFiltro   = signal<TipoVenta | ''>('');

  ngOnInit(): void {
    this.store.cargarLista();
  }

  buscar(): void {
    this.store.cargarLista({
      q:      this.busqueda() || undefined,
      estado: this.estadoFiltro() || undefined,
      tipo:   this.tipoFiltro() || undefined,
      page:   1,
    });
  }

  estadoBadgeClass(estado: EstadoVenta): string {
    const map: Record<EstadoVenta, string> = {
      activa:  'bg-blue-100 text-blue-800',
      pagada:  'bg-green-100 text-green-800',
      anulada: 'bg-gray-100 text-gray-500',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-500';
  }

  // ── Modal de abono rápido ─────────────────────────────────────────────────
  private readonly hoy = new Date().toISOString().split('T')[0];

  protected readonly abonoVenta   = signal<CfVenta | null>(null);
  protected readonly abonoMonto   = signal('');
  protected readonly abonoMedio   = signal<MedioPago>('efectivo');
  protected readonly abonoFecha   = signal(this.hoy);
  protected readonly abonoNota    = signal('');
  protected readonly abonoLoading = signal(false);
  protected readonly abonoError   = signal<string | null>(null);
  protected readonly abonoExito   = signal(false);

  protected readonly mediosPago: { value: MedioPago; label: string }[] = [
    { value: 'efectivo',      label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'nequi',         label: 'Nequi' },
    { value: 'daviplata',     label: 'Daviplata' },
    { value: 'otro',          label: 'Otro' },
  ];

  protected abrirAbono(venta: CfVenta): void {
    this.abonoMonto.set(venta.saldoPendiente);
    this.abonoMedio.set('efectivo');
    this.abonoFecha.set(this.hoy);
    this.abonoNota.set('');
    this.abonoError.set(null);
    this.abonoExito.set(false);
    this.abonoVenta.set(venta);
  }

  protected cerrarAbono(): void {
    if (!this.abonoLoading()) this.abonoVenta.set(null);
  }

  protected async confirmarAbono(): Promise<void> {
    const venta = this.abonoVenta();
    const monto = Number(this.abonoMonto());
    if (!venta || !monto || monto <= 0) { this.abonoError.set('Ingresa un monto válido.'); return; }

    this.abonoLoading.set(true);
    this.abonoError.set(null);

    try {
      await this.api.registrarAbono(venta.id, {
        monto:      String(monto),
        medioPago:  this.abonoMedio(),
        nota:       this.abonoNota() || undefined,
        fechaAbono: this.abonoFecha(),
      }, crypto.randomUUID());
      this.abonoExito.set(true);
      this.abonoVenta.set(null);
      this.store.cargarLista();
    } catch {
      this.abonoError.set('No se pudo registrar el abono. Inténtalo de nuevo.');
    } finally {
      this.abonoLoading.set(false);
    }
  }
}
