import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfReportesApi } from '../data-access/cf-reportes-api';
import type { VentaCuotaRow } from '../data-access/cf-reportes-api';

type Intervalo = 'todos' | 'semanal' | 'quincenal' | 'mensual' | 'abono';

@Component({
  selector: 'app-feature-cf-reporte-ventas',
  imports: [FormsModule, SlicePipe, CopPipe],
  templateUrl: './feature-cf-reporte-ventas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfReporteVentas {
  protected readonly Number = Number;

  private readonly api = inject(CfReportesApi);

  protected readonly cargando    = signal(false);
  protected readonly error       = signal<string | null>(null);
  protected readonly filas       = signal<VentaCuotaRow[]>([]);
  protected readonly intervalo   = signal<Intervalo>('todos');
  protected readonly fechaDesde  = signal('');
  protected readonly fechaHasta  = signal('');

  protected readonly resumen = computed(() => {
    const data = this.filasFiltradas();
    return {
      total:    data.length,
      monto:    data.reduce((s, r) => s + Number(r.subtotal_venta ?? 0), 0),
      saldo:    data.reduce((s, r) => s + Number(r.saldo_pendiente ?? 0), 0),
      vencidas: data.reduce((s, r) => s + (r.cuotas_vencidas ?? 0), 0),
    };
  });

  protected readonly filasFiltradas = computed(() => {
    const iv = this.intervalo();
    const all = this.filas();
    return iv === 'todos' ? all : all.filter(r => r.intervalo === iv);
  });

  protected readonly intervalos: { value: Intervalo; label: string }[] = [
    { value: 'todos',     label: 'Todos' },
    { value: 'semanal',   label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual',   label: 'Mensual' },
    { value: 'abono',     label: 'Por abonos' },
  ];

  estadoBadge(estado: string): string {
    return {
      activa:  'bg-blue-100 text-blue-800',
      pagada:  'bg-green-100 text-green-800',
      anulada: 'bg-gray-100 text-gray-500',
    }[estado] ?? 'bg-gray-100 text-gray-500';
  }

  intervaloBadge(iv: string | null): string {
    return {
      semanal:   'bg-indigo-100 text-indigo-700',
      quincenal: 'bg-amber-100 text-amber-700',
      mensual:   'bg-purple-100 text-purple-700',
      abono:     'bg-teal-100 text-teal-700',
    }[iv ?? ''] ?? 'bg-gray-100 text-gray-500';
  }

  async buscar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const rows = await this.api.ventasCuotas({
        fechaDesde: this.fechaDesde() || undefined,
        fechaHasta: this.fechaHasta() || undefined,
      });
      this.filas.set(rows);
    } catch {
      this.error.set('No se pudo cargar el reporte. Verifica la conexión.');
    } finally {
      this.cargando.set(false);
    }
  }

  exportar(formato: 'xlsx' | 'pdf'): void {
    const url = this.api.exportarVentasCuotas({
      fechaDesde: this.fechaDesde() || undefined,
      fechaHasta: this.fechaHasta() || undefined,
    }, formato);
    window.open(url, '_blank');
  }
}
