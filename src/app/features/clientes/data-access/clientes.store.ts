import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { ClientesApiService } from './clientes-api';
import { ClientesState, ClientesFiltros, CrearClienteDto } from './clientes.model';

const estadoInicial: ClientesState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filtros: {},
  seleccionado: null,
  loading: false,
  loadingDetalle: false,
  error: null,
};

export const ClientesStore = signalStore(
  { providedIn: 'root' },
  withState<ClientesState>(estadoInicial),
  withComputed((store) => ({
    totalPaginas: computed(() => Math.ceil(store.total() / store.pageSize())),
  })),
  withMethods((store, api = inject(ClientesApiService)) => ({
    async cargarLista(filtros?: ClientesFiltros): Promise<void> {
      const f = filtros ?? store.filtros();
      patchState(store, { loading: true, error: null, filtros: f });
      try {
        const res = await api.listar({ ...f, page: store.page(), pageSize: store.pageSize() });
        patchState(store, { items: res.items, total: res.total, loading: false });
      } catch {
        patchState(store, { error: 'No se pudo cargar la lista de clientes.', loading: false });
      }
    },

    async cargarDetalle(id: string): Promise<void> {
      patchState(store, { loadingDetalle: true, error: null });
      try {
        const cliente = await api.obtener(id);
        patchState(store, { seleccionado: cliente, loadingDetalle: false });
      } catch {
        patchState(store, { error: 'No se pudo cargar el cliente.', loadingDetalle: false });
      }
    },

    async crear(dto: CrearClienteDto): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.crear(dto);
        await this.cargarLista();
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    async actualizar(id: string, dto: Partial<CrearClienteDto>): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const actualizado = await api.actualizar(id, dto);
        patchState(store, { seleccionado: actualizado, loading: false });
        await this.cargarLista();
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    async desactivar(id: string): Promise<void> {
      await api.desactivar(id);
      await this.cargarLista();
    },

    async reactivar(id: string): Promise<void> {
      await api.reactivar(id);
      await this.cargarDetalle(id);
    },

    cambiarPagina(page: number): void {
      patchState(store, { page });
      this.cargarLista();
    },

    buscar(q: string, estado?: string): void {
      patchState(store, { page: 1 });
      const filtros: ClientesFiltros = { ...store.filtros(), q: q || undefined };
      if (estado !== undefined) filtros.estado = (estado || undefined) as ClientesFiltros['estado'];
      this.cargarLista(filtros);
    },

    limpiarSeleccionado(): void {
      patchState(store, { seleccionado: null });
    },
  })),
);
