import { TipoReporte, FiltrosReporte } from '../../reportes/data-access/reportes.model';

export interface ExportarDto {
  reporte: TipoReporte | string;
  filtros?: FiltrosReporte;
  columnas?: string[];
}

export interface ExportacionSincrona {
  tipo: 'sincrono';
  blob: Blob;
  fileName: string;
}

export interface ExportacionAsincrona {
  tipo: 'asincrono';
  jobId: string;
}

export type ExportacionResult = ExportacionSincrona | ExportacionAsincrona;

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  url_descarga: string | null;
  mensaje?: string;
}
