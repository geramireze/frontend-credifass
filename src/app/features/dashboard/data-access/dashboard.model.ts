export type RangoDashboard = '7d' | '30d' | '90d' | 'mes_actual' | 'anio_actual' | 'custom';

export interface RangoFecha {
  from: string;
  to: string;
}

export interface DashboardKpis {
  total_prestado: number;
  total_recuperado: number;
  ganancia_intereses: number;
  utilidad_neta: number;
  prestamos_activos: number;
  clientes_al_dia: number;
  clientes_en_mora: number;
  cartera_pendiente: number;
}

export interface DashboardKpisCobrador {
  ruta_hoy: number;
  cobrado_hoy: number;
  pendiente_dia: number;
  mi_cartera: number;
}

export interface SerieValor {
  fecha: string;
  valor: number;
}

export interface PagoDiaSemana {
  dia: string;
  valor: number;
}

export interface EstadoDistribucion {
  estado: string;
  valor: number;
}

export interface TopCliente {
  cliente: string;
  saldo?: number;
  mora?: number;
}

export interface DashboardSeries {
  recuperado_diario: SerieValor[];
  cartera_diaria?: SerieValor[];
  pagos_por_dia_semana: PagoDiaSemana[];
  estados_distribucion: EstadoDistribucion[];
  top_saldo: TopCliente[];
  top_mora: TopCliente[];
}

export interface DashboardResponse {
  rango: RangoFecha;
  kpis: DashboardKpis;
  series: DashboardSeries;
}

export interface DashboardState {
  kpis: DashboardKpis | null;
  series: DashboardSeries | null;
  rango: RangoDashboard;
  rangoFecha: RangoFecha | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}
