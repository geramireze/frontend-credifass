import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AuditoriaApiService } from './auditoria-api';
import { AuditoriaState, AuditoriaFiltros } from './auditoria.model';

const estadoInicial: AuditoriaState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filtros: {},
  loading: false,
  error: null,
};

export const AuditoriaStore = signalStore(
  { providedIn: 'root' },
  withState<AuditoriaState>(estadoInicial),
  withMethods((store, api = inject(AuditoriaApiService)) => ({
    async cargar(filtros?: AuditoriaFiltros): Promise<void> {
      const f = filtros ? { ...store.filtros(), ...filtros } : store.filtros();
      patchState(store, { loading: true, error: null, filtros: f });
      try {
        const res = await api.listar(f);
        patchState(store, {
          items: res.items,
          total: res.total,
          page: res.page,
          pageSize: res.pageSize,
          loading: false,
        });
      } catch {
        patchState(store, { error: 'No se pudo cargar el registro de auditoría.', loading: false });
      }
    },

    async cambiarPagina(page: number): Promise<void> {
      await this.cargar({ page });
    },

    limpiarError(): void {
      patchState(store, { error: null });
    },
  })),
);
