import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfReservasStore } from '../data-access/cf-reservas.store';
import type { EstadoReserva } from '../data-access/cf-reservas.model';

@Component({
  selector: 'app-feature-cf-reservas',
  imports: [RouterLink, FormsModule, CopPipe, DatePipe],
  templateUrl: './feature-cf-reservas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfReservas implements OnInit {
  protected readonly store = inject(CfReservasStore);
  protected busqueda = signal('');
  protected estadoFiltro = signal<EstadoReserva | ''>('');

  ngOnInit(): void {
    this.store.cargarLista();
  }

  buscar(): void {
    this.store.cargarLista({ q: this.busqueda() || undefined, estado: this.estadoFiltro() || undefined, page: 1 });
  }

  estadoBadgeClass(estado: EstadoReserva): string {
    const map: Record<EstadoReserva, string> = {
      pendiente:  'bg-amber-100 text-amber-800',
      abonada:    'bg-blue-100 text-blue-800',
      pagada:     'bg-indigo-100 text-indigo-800',
      entregada:  'bg-green-100 text-green-800',
      cancelada:  'bg-gray-100 text-gray-500',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-500';
  }
}
