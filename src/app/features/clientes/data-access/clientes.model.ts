export type EstadoCliente = 'al_dia' | 'en_mora' | 'pendiente_por_vencer' | 'inactivo' | 'sin_prestamos';

export interface ClienteListItem {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  ciudad: string;
  estado_efectivo: EstadoCliente;
  prestamos_activos: number;
  saldo_total: number;
  activo: boolean;
}

export interface ClienteDetalle extends ClienteListItem {
  direccion: string;
  notas: string | null;
  referencias: Referencia[];
  historial_mora: number;
}

export interface Referencia {
  id: string;
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface ClientesListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: ClienteListItem[];
}

export interface ClientesFiltros {
  q?: string;
  estado?: EstadoCliente;
  page?: number;
  pageSize?: number;
  sort?: 'nombre' | 'created_at' | 'estado';
}

export interface CrearClienteDto {
  nombre: string;
  documento: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  notas?: string;
  referencias?: { nombre: string; telefono: string; parentesco: string }[];
}

export interface ClientesState {
  items: ClienteListItem[];
  total: number;
  page: number;
  pageSize: number;
  filtros: ClientesFiltros;
  seleccionado: ClienteDetalle | null;
  loading: boolean;
  loadingDetalle: boolean;
  error: string | null;
}
