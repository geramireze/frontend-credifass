import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CfDashboardApi } from './cf-dashboard-api';
import type { DashboardCfState } from './cf-dashboard.model';

const inicial: DashboardCfState = {
  data: null,
  loading: false,
  error: null,
  ultimaActualizacion: null,
};

export const CfDashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardCfState>(inicial),
  withMethods((store, api = inject(CfDashboardApi)) => ({
    async cargar(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const data = await api.obtener();
        patchState(store, { data, loading: false, ultimaActualizacion: new Date() });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar el dashboard.' });
      }
    },
  })),
);
