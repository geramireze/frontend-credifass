export type TipoIdentificacion = 'CC' | 'CE' | 'NIT' | 'TI' | 'PP';

export interface CfCliente {
  id: string;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  nombreCompleto: string;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  ciudad: string | null;
  observaciones: string | null;
  activo: boolean;
  saldoPendiente?: string;
  totalVentas?: number;
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

export interface CfAbonoCliente {
  id: string;
  ventaId: string;
  ventaNumero: string;
  monto: string;
  medioPago: string;
  nota: string | null;
  fechaAbono: string;
  createdAt: string;
}

export interface CfProductoComprado {
  productoId: string;
  productoNombre: string;
  totalCantidad: number;
  totalGastado: string;
  cantidadVentas: number;
}

export interface CrearCfClienteDto {
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  nombreCompleto: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  observaciones?: string;
}
