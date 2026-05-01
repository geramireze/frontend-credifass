import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CfProductosApi } from './cf-productos-api';
import type { CfProductosState, CfProductosFiltros, CrearProductoDto } from './cf-productos.model';

const inicial: CfProductosState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filtros: {},
  seleccionado: null,
  loading: false,
  error: null,
};

export const CfProductosStore = signalStore(
  { providedIn: 'root' },
  withState<CfProductosState>(inicial),
  withMethods((store, api = inject(CfProductosApi)) => ({
    async cargarLista(filtros?: CfProductosFiltros): Promise<void> {
      const f = filtros ?? store.filtros();
      patchState(store, { loading: true, error: null, filtros: f });
      try {
        const res = await api.listar({ ...f, page: store.page(), pageSize: store.pageSize() });
        patchState(store, { items: res.items, total: res.total, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar el inventario.' });
      }
    },

    async cargarDetalle(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const producto = await api.obtener(id);
        patchState(store, { seleccionado: producto, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar el producto.' });
      }
    },

    async crear(dto: CrearProductoDto): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.crear(dto);
        await this.cargarLista();
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    async ajustarStock(id: string, nuevoStock: number, notas?: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.ajustarStock(id, nuevoStock, notas);
        await this.cargarLista();
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    cambiarPagina(page: number): void {
      patchState(store, { page });
      this.cargarLista();
    },
  })),
);
