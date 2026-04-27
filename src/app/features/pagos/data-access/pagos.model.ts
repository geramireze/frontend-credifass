export interface RegistrarPagoDto {
  prestamo_id: string;
  monto: number;
  fecha?: string;
  medio?: 'efectivo' | 'transferencia' | 'otro';
  nota?: string;
  idempotency_key: string;
}

export interface PagoRegistrado {
  id: string;
  prestamo_id: string;
  monto: number;
  fecha_pago: string;
  estado: 'aplicado' | 'anulado';
  cuotas_afectadas: string[];
  saldo_restante: number;
}

export interface CuotaRuta {
  prestamo_id: string;
  cliente_nombre: string;
  cliente_documento: string;
  cliente_telefono: string;
  cliente_direccion: string;
  cuota_id: string;
  cuota_numero: number;
  cuotas_totales: number;
  fecha_esperada: string;
  valor: number;
  mora_acumulada: number;
  estado: string;
}

export interface RutaHoy {
  total_cuotas: number;
  cobrado: number;
  pendiente: number;
  mi_cartera?: number;
  cuotas: CuotaRuta[];
  proximas_cuotas: CuotaRuta[];
}
