import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfProductosStore } from '../data-access/cf-productos.store';
import type { EstadoProducto } from '../data-access/cf-productos.model';

@Component({
  selector: 'app-feature-cf-productos',
  imports: [RouterLink, FormsModule, CopPipe],
  templateUrl: './feature-cf-productos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfProductos implements OnInit {
  protected readonly store = inject(CfProductosStore);

  protected busqueda = signal('');
  protected estadoFiltro = signal<EstadoProducto | ''>('');

  ngOnInit(): void {
    this.store.cargarLista();
  }

  buscar(): void {
    this.store.cargarLista({ q: this.busqueda(), estado: this.estadoFiltro() || undefined, page: 1 });
  }

  estadoBadgeClass(estado: EstadoProducto): string {
    const map: Record<EstadoProducto, string> = {
      disponible: 'bg-green-100 text-green-800',
      reservado:  'bg-amber-100 text-amber-800',
      agotado:    'bg-red-100 text-red-800',
      inactivo:   'bg-gray-100 text-gray-500',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-500';
  }
}
