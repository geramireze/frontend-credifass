export type TipoIdentificacion = 'CC' | 'CE' | 'NIT' | 'TI' | 'PP';

export interface CfCliente {
  id: string;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  nombreCompleto: string;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  saldoPendiente?: string;
  cuotasVencidas?: number;
}

export interface CfClientesFiltros {
  q?: string;
  soloActivos?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CfClientesState {
  items: CfCliente[];
  total: number;
  page: number;
  pageSize: number;
  filtros: CfClientesFiltros;
  seleccionado: CfCliente | null;
  loading: boolean;
  error: string | null;
}

export interface CrearCfClienteDto {
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  nombreCompleto: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  notas?: string;
}
