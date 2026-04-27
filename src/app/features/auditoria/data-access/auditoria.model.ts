export interface AuditoriaItem {
  id: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  usuario_id: string | null;
  usuario_nombre: string | null;
  ip: string | null;
  request_id: string | null;
  payload_nuevo: Record<string, unknown> | null;
  payload_anterior: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditoriaFiltros {
  accion?: string;
  entidad?: string;
  usuario_id?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditoriaResponse {
  total: number;
  page: number;
  pageSize: number;
  items: AuditoriaItem[];
}

export interface AuditoriaState {
  items: AuditoriaItem[];
  total: number;
  page: number;
  pageSize: number;
  filtros: AuditoriaFiltros;
  loading: boolean;
  error: string | null;
}
