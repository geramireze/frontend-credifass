import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrestamosStore } from '../data-access/prestamos.store';
import { AuthStore } from '../../auth/data-access/auth.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { EstadoPrestamo } from '../data-access/prestamos.model';

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
  imports: [RouterLink, CopPipe, AppIconComponent],
  templateUrl: './feature-prestamos.html',
  styleUrl: './feature-prestamos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePrestamos implements OnInit {
  protected readonly store = inject(PrestamosStore);
  protected readonly authStore = inject(AuthStore);

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
}
