export type EstadoReserva = 'pendiente' | 'abonada' | 'pagada' | 'entregada' | 'cancelada';
export type TipoOrigenReserva = 'en_inventario' | 'por_encargo';

export interface CfAbonoReserva {
  id: string;
  monto: string;
  medioPago: string;
  fechaAbono: string;
  anulado: boolean;
  idempotencyKey: string | null;
}

export interface CfReserva {
  id: string;
  numeroReserva: string;
  clienteId: string;
  clienteNombre: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioAcordado: string;
  totalAbonado: string;
  saldoPendiente: string;
  estado: EstadoReserva;
  tipoOrigen: TipoOrigenReserva;
  fechaEntregaEstimada: string | null;
  notas: string | null;
  ventaId: string | null;
  abonos?: CfAbonoReserva[];
}

export interface CfReservasFiltros {
  q?: string;
  estado?: EstadoReserva | '';
  page?: number;
  pageSize?: number;
}

export interface CfReservasState {
  items: CfReserva[];
  total: number;
  page: number;
  pageSize: number;
  filtros: CfReservasFiltros;
  seleccionado: CfReserva | null;
  loading: boolean;
  error: string | null;
}

export interface CrearReservaDto {
  clienteId: string;
  productoId: string;
  cantidad: number;
  precioAcordado: string;
  tipoOrigen: TipoOrigenReserva;
  abonoInicial?: string;
  medioPagoAbono?: string;
  fechaEntregaEstimada?: string;
  notas?: string;
}

export interface RegistrarAbonoDto {
  monto: string;
  medioPago: string;
  idempotencyKey: string;
  notas?: string;
}
