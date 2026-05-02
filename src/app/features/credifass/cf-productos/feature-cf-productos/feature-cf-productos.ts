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

  protected busqueda    = signal('');
  protected estadoFiltro = signal<EstadoProducto | ''>('');
  protected confirmInactivarId = signal<string | null>(null);
  protected errorAccion = signal<string | null>(null);

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

  pedirConfirmacionInactivar(id: string): void {
    this.errorAccion.set(null);
    this.confirmInactivarId.set(id);
  }

  cancelarConfirmacion(): void {
    this.confirmInactivarId.set(null);
  }

  async confirmarInactivar(): Promise<void> {
    const id = this.confirmInactivarId();
    if (!id) return;
    this.confirmInactivarId.set(null);
    this.errorAccion.set(null);
    try {
      await this.store.inactivar(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo inactivar el producto.';
      this.errorAccion.set(msg);
    }
  }
}
