import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CfReservasApi } from './cf-reservas-api';
import type { CfReservasState, CfReservasFiltros, CrearReservaDto, RegistrarAbonoDto } from './cf-reservas.model';

const inicial: CfReservasState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filtros: {},
  seleccionado: null,
  loading: false,
  error: null,
};

export const CfReservasStore = signalStore(
  { providedIn: 'root' },
  withState<CfReservasState>(inicial),
  withMethods((store, api = inject(CfReservasApi)) => ({
    async cargarLista(filtros?: CfReservasFiltros): Promise<void> {
      const f = filtros ?? store.filtros();
      patchState(store, { loading: true, error: null, filtros: f });
      try {
        const res = await api.listar({ ...f, page: store.page(), pageSize: store.pageSize() });
        patchState(store, { items: res.items, total: res.total, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar las reservas.' });
      }
    },

    async cargarDetalle(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const reserva = await api.obtener(id);
        patchState(store, { seleccionado: reserva, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar la reserva.' });
      }
    },

    async crear(dto: CrearReservaDto): Promise<string> {
      patchState(store, { loading: true, error: null });
      try {
        const reserva = await api.crear(dto);
        await this.cargarLista();
        return reserva.id;
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    async registrarAbono(id: string, dto: RegistrarAbonoDto): Promise<void> {
      try {
        await api.registrarAbono(id, dto);
        await this.cargarDetalle(id);
      } catch (err: unknown) {
        throw err;
      }
    },

    async cancelar(id: string, motivo: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.cancelar(id, motivo);
        await this.cargarLista();
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    async entregar(id: string, planCuotas?: { nCuotas: number; fechaInicio: string; intervalo: string }): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.entregar(id, planCuotas);
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
