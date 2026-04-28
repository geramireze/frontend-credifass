import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { EmptyError, TimeoutError } from 'rxjs';
import { PagosApiService } from './pagos-api';
import { RutaHoy, CuotaRuta, RegistrarPagoDto } from './pagos.model';

interface PagosState {
  ruta: RutaHoy | null;
  cuotaSeleccionada: CuotaRuta | null;
  pagoExitoso: boolean;
  loading: boolean;
  error: string | null;
}

const BACKEND_CODES: Record<string, string> = {
  FECHA_FUTURA: 'La fecha del pago no puede ser futura.',
  INVALID_AMOUNT: 'El monto debe ser mayor a cero.',
  PRESTAMO_CLOSED: 'Este préstamo ya está cerrado (pagado o cancelado).',
  PRESTAMO_NOT_ASSIGNED: 'No tienes permiso para cobrar este préstamo.',
  PRESTAMO_NOT_FOUND: 'Préstamo no encontrado.',
  PAGO_YA_ANULADO: 'Este pago ya fue anulado.',
};

function extractErrorMsg(err: unknown, fallback: string): string {
  if (err instanceof TimeoutError) return 'La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.';
  const asAny = err as { status?: number; error?: { message?: string | string[]; code?: string }; message?: string };
  if (asAny?.status === 0) return 'Sin conexión al servidor. Verifica tu red e intenta de nuevo.';
  const body = asAny?.error;
  const fromMsg = Array.isArray(body?.message) ? body!.message[0] : body?.message;
  if (fromMsg) return fromMsg;
  if (body?.code && BACKEND_CODES[body.code]) return BACKEND_CODES[body.code];
  return asAny?.message ?? fallback;
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
      } catch (err: unknown) {
        if (err instanceof EmptyError) { patchState(store, { loading: false }); return; }
        patchState(store, { error: extractErrorMsg(err, 'No se pudo cargar la ruta de hoy.'), loading: false });
      }
    },

    seleccionarCuota(cuota: CuotaRuta): void {
      patchState(store, { cuotaSeleccionada: cuota, pagoExitoso: false, error: null });
    },

    cancelarSeleccion(): void {
      patchState(store, { cuotaSeleccionada: null });
    },

    async registrarPago(dto: RegistrarPagoDto): Promise<void> {
      patchState(store, { loading: true, error: null, pagoExitoso: false });
      try {
        await api.registrar(dto);
        patchState(store, { pagoExitoso: true, cuotaSeleccionada: null, loading: false });
        const ruta = await api.rutaHoy();
        patchState(store, { ruta });
      } catch (err: unknown) {
        if (err instanceof EmptyError) { patchState(store, { loading: false }); return; }
        patchState(store, { error: extractErrorMsg(err, 'No se pudo registrar el pago. Intenta de nuevo.'), loading: false });
      }
    },

    limpiarError(): void {
      patchState(store, { error: null });
    },
  })),
);
