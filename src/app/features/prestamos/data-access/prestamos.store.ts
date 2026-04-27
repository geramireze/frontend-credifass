import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { PrestamosApiService } from './prestamos-api';
import { PrestamosState, PrestamosFiltros, CrearPrestamoDto, SimulacionRequest } from './prestamos.model';

const estadoInicial: PrestamosState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filtros: {},
  seleccionado: null,
  cuotas: [],
  simulacion: null,
  loading: false,
  loadingSimulacion: false,
  error: null,
};

export const PrestamosStore = signalStore(
  { providedIn: 'root' },
  withState<PrestamosState>(estadoInicial),
  withMethods((store, api = inject(PrestamosApiService)) => ({
    async cargarLista(filtros?: PrestamosFiltros): Promise<void> {
      const f = filtros ?? store.filtros();
      patchState(store, { loading: true, error: null, filtros: f });
      try {
        const res = await api.listar({ ...f, page: store.page(), pageSize: store.pageSize() });
        patchState(store, { items: res.items, total: res.total, loading: false });
      } catch {
        patchState(store, { error: 'No se pudo cargar los préstamos.', loading: false });
      }
    },

    async cargarDetalle(id: string): Promise<void> {
      patchState(store, { loading: true });
      try {
        const [prestamo, cuotas] = await Promise.all([api.obtener(id), api.cuotas(id)]);
        patchState(store, { seleccionado: prestamo, cuotas, loading: false });
      } catch {
        patchState(store, { error: 'No se pudo cargar el préstamo.', loading: false });
      }
    },

    async simular(dto: SimulacionRequest): Promise<void> {
      patchState(store, { loadingSimulacion: true });
      try {
        const sim = await api.simular(dto);
        patchState(store, { simulacion: sim, loadingSimulacion: false });
      } catch {
        patchState(store, { loadingSimulacion: false });
        throw new Error('Error en simulación');
      }
    },

    async crear(dto: CrearPrestamoDto): Promise<string> {
      patchState(store, { loading: true, error: null });
      try {
        const prestamo = await api.crear(dto);
        await this.cargarLista();
        return prestamo.id;
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    async cancelar(id: string, motivo?: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.cancelar(id, motivo);
        patchState(store, { seleccionado: null, loading: false });
        await this.cargarLista();
      } catch {
        patchState(store, { error: 'No se pudo cancelar el préstamo.', loading: false });
        throw new Error('Error al cancelar préstamo');
      }
    },

    cambiarPagina(page: number): void {
      patchState(store, { page });
      this.cargarLista();
    },

    limpiarSimulacion(): void {
      patchState(store, { simulacion: null });
    },
  })),
);
