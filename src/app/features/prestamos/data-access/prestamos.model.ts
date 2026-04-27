export type EstadoPrestamo = 'al_dia' | 'pendiente_por_vencer' | 'en_mora' | 'pagado' | 'cancelado';
export type FrecuenciaPago = 'semanal' | 'quincenal';

export interface PrestamoListItem {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  cobrador_id: string | null;
  cobrador_nombre: string | null;
  monto_prestado: number;
  monto_total: number;
  cuota_semanal: number;
  numero_semanas: number;
  frecuencia_pago: FrecuenciaPago;
  cuotas_pagadas: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: EstadoPrestamo;
  saldo_pendiente: number;
  mora_acumulada: number;
}

export interface CuotaPrestamo {
  id: string;
  numero: number;
  fecha_esperada: string;
  valor: number;
  pagado: number;
  estado: 'pendiente' | 'pagada' | 'vencida';
  mora_acumulada: number;
}

export interface SimulacionRequest {
  montoPrestado: number;
  tasaSemanal: number;
  numeroSemanas: number;
  modoInteres: 'simple' | 'saldo';
  fechaInicio: string;
  frecuenciaPago?: FrecuenciaPago;
}

export interface SimulacionResponse {
  montoTotal: number;
  cuotaSemanal: number;
  fechaVencimiento: string;
  cronograma: { numero: number; fechaEsperada: string; valor: number }[];
  nCuotas?: number;
}

export interface CrearPrestamoDto {
  clienteId: string;
  cobradorId?: string;
  montoPrestado: number;
  tasaSemanal: number;
  numeroSemanas: number;
  modoInteres: 'simple' | 'saldo';
  fechaInicio: string;
  frecuenciaPago?: FrecuenciaPago;
  moraActiva?: boolean;
  tasaMoraSemanal?: number;
  observaciones?: string;
}

export interface PrestamosListResponse {
  total: number;
  page?: number;
  pageSize?: number;
  items: PrestamoListItem[];
}

export interface PrestamosFiltros {
  cliente_id?: string;
  estado?: EstadoPrestamo;
  cobrador_id?: string;
  page?: number;
  pageSize?: number;
}

export interface PrestamosState {
  items: PrestamoListItem[];
  total: number;
  page: number;
  pageSize: number;
  filtros: PrestamosFiltros;
  seleccionado: PrestamoListItem | null;
  cuotas: CuotaPrestamo[];
  simulacion: SimulacionResponse | null;
  loading: boolean;
  loadingSimulacion: boolean;
  error: string | null;
}
