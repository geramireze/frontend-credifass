import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { PrestamosStore } from '../data-access/prestamos.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { EstadoPrestamo, CuotaPrestamo } from '../data-access/prestamos.model';

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

const CUOTA_BADGE: Record<CuotaPrestamo['estado'], string> = {
  pendiente: 'badge badge-info',
  pagada: 'badge badge-success',
  vencida: 'badge badge-mora',
};

const CUOTA_LABELS: Record<CuotaPrestamo['estado'], string> = {
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  vencida: 'Vencida',
};

@Component({
  selector: 'app-feature-prestamo-detalle',
  imports: [RouterLink, CopPipe, AppIconComponent, SlicePipe],
  templateUrl: './feature-prestamo-detalle.html',
  styleUrl: './feature-prestamo-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePrestamoDetalle implements OnInit {
  protected readonly store = inject(PrestamosStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly tabActivo = signal<'resumen' | 'cronograma' | 'pagos' | 'auditoria'>('cronograma');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.cargarDetalle(id);
  }

  protected estadoLabel(e: string): string  { return ESTADO_LABELS[e as EstadoPrestamo] ?? e; }
  protected estadoBadge(e: string): string  { return ESTADO_BADGE[e as EstadoPrestamo] ?? 'badge'; }
  protected cuotaBadge(e: string): string   { return CUOTA_BADGE[e as CuotaPrestamo['estado']] ?? 'badge'; }
  protected cuotaLabel(e: string): string   { return CUOTA_LABELS[e as CuotaPrestamo['estado']] ?? e; }

  protected formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  protected pctPagado(prestamo: { saldo_pendiente: number; monto_total: number }): number {
    const pagado = prestamo.monto_total - prestamo.saldo_pendiente;
    return Math.max(0, Math.min(100, Math.round((pagado / prestamo.monto_total) * 100)));
  }

  protected async confirmarCancelar(id: string): Promise<void> {
    if (!confirm('¿Cancelar este préstamo? Esta acción no se puede deshacer.')) return;
    try {
      await this.store.cancelar(id);
      await this.router.navigate(['/prestamos']);
    } catch {
      // error is set in store
    }
  }
}
