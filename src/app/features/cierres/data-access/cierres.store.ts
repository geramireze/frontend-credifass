import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CierresApi } from './cierres-api';
import type { CierresState, CierreSemana } from './cierres.model';
import type { ApiError } from '../../../core/http/error-interceptor';

const inicial: CierresState = {
  items:         [],
  seleccionado:  null,
  loading:       false,
  guardando:     false,
  error:         null,
  diasRestantes: null,
  proximoCierre: null,
};

export const CierresStore = signalStore(
  { providedIn: 'root' },
  withState<CierresState>(inicial),
  withMethods((store, api = inject(CierresApi)) => ({
    async cargar(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const items = await api.listar();
        patchState(store, { items, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar los cierres.' });
      }
    },

    seleccionar(cierre: CierreSemana): void {
      patchState(store, { seleccionado: cierre });
    },

    cerrarDetalle(): void {
      patchState(store, { seleccionado: null });
    },

    cerrarAviso(): void {
      patchState(store, { diasRestantes: null, proximoCierre: null });
    },

    async realizarCierre(): Promise<void> {
      patchState(store, { guardando: true, error: null, diasRestantes: null, proximoCierre: null });
      try {
        const nuevo = await api.crear();
        patchState(store, {
          guardando: false,
          items: [nuevo, ...store.items()],
          seleccionado: nuevo,
        });
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        if (apiErr.code === 'CIERRE_DEMASIADO_PRONTO') {
          patchState(store, {
            guardando: false,
            diasRestantes: (apiErr.data?.['diasRestantes'] as number) ?? null,
            proximoCierre: (apiErr.data?.['proximoCierre'] as string) ?? null,
          });
        } else {
          patchState(store, { guardando: false, error: 'No se pudo realizar el cierre.' });
        }
      }
    },
  })),
);
