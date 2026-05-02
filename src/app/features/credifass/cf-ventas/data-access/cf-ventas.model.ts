export type TipoVenta = 'contado' | 'cuotas' | 'abono';
export type EstadoVenta = 'activa' | 'pagada' | 'anulada';
export type IntervaloVenta = 'semanal' | 'quincenal' | 'mensual';
export type MedioPago = 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'otro';

export interface LineaVenta {
  productoId: string;
  cantidad: number;
}

export interface CuotaSimulada {
  numero: number;
  valor: string;
  fechaEsperada: string;
}

export interface SimulacionCuotas {
  cuotas: CuotaSimulada[];
  totalVenta: string;
  residuo: string;
}

export interface CfCuota {
  id: string;
  numero: number;
  valor: string;
  saldoCuota: string;
  fechaEsperada: string;
  estado: 'pendiente' | 'pagada' | 'vencida' | 'parcial';
}

export interface CfPagoCuota {
  id: string;
  cuotaId: string;
  numeroCuota: number;
  monto: string;
  medioPago: MedioPago;
  fechaPago: string;
  anulado: boolean;
  idempotencyKey: string | null;
}

export interface CfAbonoVenta {
  id: string;
  ventaId: string;
  monto: string;
  fechaAbono: string;
  medioPago: MedioPago;
  nota: string | null;
  anulado: boolean;
  createdAt: string;
}

export interface CfVenta {
  id: string;
  numeroVenta: string;
  clienteId: string;
  clienteNombre: string;
  vendedorId: string;
  tipo: TipoVenta;
  estado: EstadoVenta;
  fechaVenta: string;
  subtotalVenta: string;
  descuentoTotal: string;
  gananciaTotal: string;
  saldoPendiente: string;
  nCuotas: number | null;
  intervalo: IntervaloVenta | null;
  cuotas?: CfCuota[];
  pagos?: CfPagoCuota[];
  abonos?: CfAbonoVenta[];
}

export interface CfVentasFiltros {
  q?: string;
  tipo?: TipoVenta | '';
  estado?: EstadoVenta | '';
  fechaDesde?: string;
  fechaHasta?: string;
  clienteId?: string;
  page?: number;
  pageSize?: number;
}

export interface CfVentasState {
  items: CfVenta[];
  total: number;
  page: number;
  pageSize: number;
  filtros: CfVentasFiltros;
  seleccionado: CfVenta | null;
  simulacion: SimulacionCuotas | null;
  loading: boolean;
  loadingDetalle: boolean;
  error: string | null;
}

export interface CrearVentaDto {
  clienteId: string;
  lineas: LineaVenta[];
  tipo: TipoVenta;
  planCuotas?: { nCuotas: number; fechaInicio: string; intervalo: IntervaloVenta };
  reservaId?: string;
  notas?: string;
}

export interface RegistrarPagoDto {
  cuotaId: string;
  monto: string;
  medioPago: MedioPago;
  idempotencyKey: string;
}

export interface RegistrarAbonoDto {
  monto: string;
  medioPago: MedioPago;
  nota?: string;
  fechaAbono?: string;
}
