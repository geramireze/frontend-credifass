import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { PagosApiService } from './pagos-api';
import { RutaHoy, CuotaRuta, RegistrarPagoDto } from './pagos.model';

interface PagosState {
  ruta: RutaHoy | null;
  cuotaSeleccionada: CuotaRuta | null;
  pagoExitoso: boolean;
  loading: boolean;
  error: string | null;
}

const estadoInicial: PagosState = {
  ruta: null,
  cuotaSeleccionada: null,
  pagoExitoso: false,
  loading: false,
  error: null,
};

export const PagosStore = signalStore(
  { providedIn: 'root' },
  withState<PagosState>(estadoInicial),
  withMethods((store, api = inject(PagosApiService)) => ({
    async cargarRuta(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const ruta = await api.rutaHoy();
        patchState(store, { ruta, loading: false });
      } catch {
        patchState(store, { error: 'No se pudo cargar la ruta de hoy.', loading: false });
      }
    },

    seleccionarCuota(cuota: CuotaRuta): void {
      patchState(store, { cuotaSeleccionada: cuota, pagoExitoso: false, error: null });
    },

    cancelarSeleccion(): void {
      patchState(store, { cuotaSeleccionada: null });
    },

    async registrarPago(dto: RegistrarPagoDto): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.registrar(dto);
        patchState(store, { pagoExitoso: true, cuotaSeleccionada: null, loading: false });
        const ruta = await api.rutaHoy();
        patchState(store, { ruta });
      } catch {
        patchState(store, { error: 'No se pudo registrar el pago. Intenta de nuevo.', loading: false });
      }
    },

    limpiarError(): void {
      patchState(store, { error: null });
    },
  })),
);
