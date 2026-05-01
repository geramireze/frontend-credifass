export interface DashboardCfResult {
  inventario: {
    totalProductos: number;
    stockDisponibleTotal: number;
    productosAgotados: number;
    productosReservados: number;
    totalInvertido: string;
    valorInventarioVenta: string;
    margenPotencial: string;
  };
  ventas: {
    hoy:      { monto: string; count: number; ganancia: string };
    semana:   { monto: string; count: number; ganancia: string };
    mes:      { monto: string; count: number; ganancia: string };
    historico:{ monto: string; ganancia: string };
  };
  cartera: {
    saldoPendienteTotal: string;
    clientesConDeuda: number;
    clientesEnMora: number;
    cuotasVencidasTotal: number;
    cuotasPendientesHoy: number;
    abonosHoy: string;
  };
  reservas: {
    activas: number;
    abonosHoy: string;
  };
}

export interface DashboardCfState {
  data: DashboardCfResult | null;
  loading: boolean;
  error: string | null;
  ultimaActualizacion: Date | null;
}
