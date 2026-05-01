import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfVentasStore } from '../data-access/cf-ventas.store';
import type { EstadoVenta, TipoVenta } from '../data-access/cf-ventas.model';

@Component({
  selector: 'app-feature-cf-ventas',
  imports: [RouterLink, FormsModule, CopPipe, DatePipe],
  templateUrl: './feature-cf-ventas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfVentas implements OnInit {
  protected readonly store = inject(CfVentasStore);
  protected busqueda = signal('');
  protected estadoFiltro = signal<EstadoVenta | ''>('');
  protected tipoFiltro = signal<TipoVenta | ''>('');

  ngOnInit(): void {
    this.store.cargarLista();
  }

  buscar(): void {
    this.store.cargarLista({
      q: this.busqueda() || undefined,
      estado: this.estadoFiltro() || undefined,
      tipo: this.tipoFiltro() || undefined,
      page: 1,
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
}
