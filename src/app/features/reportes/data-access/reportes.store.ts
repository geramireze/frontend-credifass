import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { ReportesApiService } from './reportes-api';
import { ReportesState, TipoReporte, FiltrosReporte } from './reportes.model';

const estadoInicial: ReportesState = {
  reporteActivo: null,
  datos: null,
  filtros: { page: 1, pageSize: 20 },
  loading: false,
  error: null,
};

export const ReportesStore = signalStore(
  { providedIn: 'root' },
  withState<ReportesState>(estadoInicial),
  withMethods((store, api = inject(ReportesApiService)) => ({
    async seleccionar(tipo: TipoReporte): Promise<void> {
      patchState(store, { reporteActivo: tipo, filtros: { page: 1, pageSize: 20 }, datos: null });
      await this.cargar();
    },

    async cargar(): Promise<void> {
      const tipo = store.reporteActivo();
      if (!tipo) return;
      patchState(store, { loading: true, error: null });
      try {
        const datos = await api.obtener(tipo, store.filtros());
        patchState(store, { datos, loading: false });
      } catch {
        patchState(store, { error: 'No se pudo cargar el reporte.', loading: false });
      }
    },

    async aplicarFiltros(filtros: FiltrosReporte): Promise<void> {
      patchState(store, { filtros: { ...store.filtros(), ...filtros, page: 1 } });
      await this.cargar();
    },

    async cambiarPagina(page: number): Promise<void> {
      patchState(store, { filtros: { ...store.filtros(), page } });
      await this.cargar();
    },

    limpiarError(): void {
      patchState(store, { error: null });
    },
  })),
);
