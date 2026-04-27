import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { ExportacionApiService } from './exportacion-api';
import { ExportarDto, JobStatus } from './exportacion.model';

interface ExportacionState {
  loading: boolean;
  jobId: string | null;
  jobStatus: JobStatus | null;
  error: string | null;
}

const estadoInicial: ExportacionState = {
  loading: false,
  jobId: null,
  jobStatus: null,
  error: null,
};

export const ExportacionStore = signalStore(
  { providedIn: 'root' },
  withState<ExportacionState>(estadoInicial),
  withMethods((store, api = inject(ExportacionApiService)) => ({
    async exportarExcel(dto: ExportarDto): Promise<void> {
      patchState(store, { loading: true, error: null, jobId: null, jobStatus: null });
      try {
        const res = await api.exportarExcel(dto);
        if (res.tipo === 'asincrono') {
          patchState(store, { jobId: res.jobId, loading: false });
        } else {
          descargarBlob(res.blob, res.fileName);
          patchState(store, { loading: false });
        }
      } catch {
        patchState(store, { error: 'No se pudo exportar a Excel.', loading: false });
      }
    },

    async exportarPdf(dto: ExportarDto): Promise<void> {
      patchState(store, { loading: true, error: null, jobId: null, jobStatus: null });
      try {
        const res = await api.exportarPdf(dto);
        if (res.tipo === 'asincrono') {
          patchState(store, { jobId: res.jobId, loading: false });
        } else {
          descargarBlob(res.blob, res.fileName);
          patchState(store, { loading: false });
        }
      } catch {
        patchState(store, { error: 'No se pudo exportar a PDF.', loading: false });
      }
    },

    async consultarJob(): Promise<void> {
      const jobId = store.jobId();
      if (!jobId) return;
      try {
        const status = await api.consultarJob(jobId);
        patchState(store, { jobStatus: status });
        if (status.status === 'done' && status.url_descarga) {
          window.open(status.url_descarga, '_blank');
          patchState(store, { jobId: null, jobStatus: null });
        }
      } catch {
        patchState(store, { error: 'Error al consultar el estado del trabajo.' });
      }
    },

    limpiarError(): void {
      patchState(store, { error: null });
    },

    limpiar(): void {
      patchState(store, estadoInicial);
    },
  })),
);

function descargarBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
