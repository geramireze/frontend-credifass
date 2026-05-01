import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CfClientesApi } from './cf-clientes-api';
import type { CfClientesState, CfClientesFiltros, CrearCfClienteDto } from './cf-clientes.model';

const inicial: CfClientesState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filtros: {},
  seleccionado: null,
  loading: false,
  error: null,
};

export const CfClientesStore = signalStore(
  { providedIn: 'root' },
  withState<CfClientesState>(inicial),
  withMethods((store, api = inject(CfClientesApi)) => ({
    async cargarLista(filtros?: CfClientesFiltros): Promise<void> {
      const f = filtros ?? store.filtros();
      patchState(store, { loading: true, error: null, filtros: f });
      try {
        const res = await api.listar({ ...f, page: store.page(), pageSize: store.pageSize() });
        patchState(store, { items: res.items, total: res.total, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar la lista de clientes.' });
      }
    },

    async cargarDetalle(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const cliente = await api.obtener(id);
        patchState(store, { seleccionado: cliente, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar el cliente.' });
      }
    },

    async crear(dto: CrearCfClienteDto): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.crear(dto);
        await this.cargarLista();
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    async actualizar(id: string, dto: Partial<CrearCfClienteDto>): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.actualizar(id, dto);
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
