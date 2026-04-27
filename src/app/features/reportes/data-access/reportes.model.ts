export type TipoReporte =
  | 'clientes-al-dia'
  | 'clientes-mora'
  | 'prestamos-activos'
  | 'prestamos-pagados'
  | 'ganancias'
  | 'capital-prestado'
  | 'utilidad-neta'
  | 'pagos-cobrador'
  | 'cuotas-por-vencer';

export interface FiltrosReporte {
  from?: string;
  to?: string;
  cliente_id?: string;
  cobrador_id?: string;
  estado?: string;
  q?: string;
  sort?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ReporteResponse {
  filtros_aplicados: Record<string, unknown>;
  total: number;
  page: number;
  pageSize: number;
  items: Record<string, unknown>[];
  totales?: Record<string, unknown>;
}

export interface ReporteMeta {
  id: TipoReporte;
  titulo: string;
  descripcion: string;
  columnas: { campo: string; header: string; tipo: 'texto' | 'numero' | 'fecha' | 'moneda' }[];
  roles: ('admin' | 'supervisor' | 'cobrador')[];
}

export const REPORTES_META: ReporteMeta[] = [
  {
    id: 'clientes-mora',
    titulo: 'Clientes en mora',
    descripcion: 'Clientes con al menos un préstamo vencido.',
    columnas: [
      { campo: 'cliente_nombre', header: 'Cliente', tipo: 'texto' },
      { campo: 'prestamos_en_mora', header: 'Préstamos en mora', tipo: 'numero' },
      { campo: 'monto_vencido', header: 'Monto vencido', tipo: 'moneda' },
      { campo: 'dias_atraso_max', header: 'Días de atraso', tipo: 'numero' },
      { campo: 'ultimo_pago', header: 'Último pago', tipo: 'fecha' },
      { campo: 'cobrador', header: 'Cobrador', tipo: 'texto' },
    ],
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  {
    id: 'clientes-al-dia',
    titulo: 'Clientes al día',
    descripcion: 'Clientes sin cuotas vencidas.',
    columnas: [
      { campo: 'cliente_nombre', header: 'Cliente', tipo: 'texto' },
      { campo: 'prestamos_activos', header: 'Préstamos activos', tipo: 'numero' },
      { campo: 'saldo_total', header: 'Saldo total', tipo: 'moneda' },
      { campo: 'cobrador', header: 'Cobrador', tipo: 'texto' },
    ],
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'prestamos-activos',
    titulo: 'Préstamos activos',
    descripcion: 'Préstamos no pagados ni cancelados.',
    columnas: [
      { campo: 'cliente_nombre', header: 'Cliente', tipo: 'texto' },
      { campo: 'monto_prestado', header: 'Monto', tipo: 'moneda' },
      { campo: 'cuota_semanal', header: 'Cuota/sem.', tipo: 'moneda' },
      { campo: 'saldo_pendiente', header: 'Saldo pendiente', tipo: 'moneda' },
      { campo: 'estado', header: 'Estado', tipo: 'texto' },
      { campo: 'cobrador', header: 'Cobrador', tipo: 'texto' },
    ],
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  {
    id: 'prestamos-pagados',
    titulo: 'Préstamos pagados',
    descripcion: 'Préstamos cerrados en el rango.',
    columnas: [
      { campo: 'cliente_nombre', header: 'Cliente', tipo: 'texto' },
      { campo: 'monto_prestado', header: 'Monto', tipo: 'moneda' },
      { campo: 'fecha_inicio', header: 'Inicio', tipo: 'fecha' },
      { campo: 'fecha_pago_final', header: 'Fecha cierre', tipo: 'fecha' },
    ],
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'ganancias',
    titulo: 'Ganancias por intereses',
    descripcion: 'Ganancia por cada préstamo en el rango.',
    columnas: [
      { campo: 'cliente_nombre', header: 'Cliente', tipo: 'texto' },
      { campo: 'monto_prestado', header: 'Monto prestado', tipo: 'moneda' },
      { campo: 'monto_total', header: 'Monto total', tipo: 'moneda' },
      { campo: 'ganancia', header: 'Ganancia', tipo: 'moneda' },
    ],
    roles: ['admin'],
  },
  {
    id: 'capital-prestado',
    titulo: 'Capital total prestado',
    descripcion: 'Desembolsos agrupados por cobrador en el rango.',
    columnas: [
      { campo: 'cobrador', header: 'Cobrador', tipo: 'texto' },
      { campo: 'total_prestamos', header: 'N° préstamos', tipo: 'numero' },
      { campo: 'monto_total', header: 'Monto total', tipo: 'moneda' },
    ],
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'pagos-cobrador',
    titulo: 'Pagos por cobrador',
    descripcion: 'Resumen de pagos recibidos por cada cobrador.',
    columnas: [
      { campo: 'cobrador', header: 'Cobrador', tipo: 'texto' },
      { campo: 'total_pagos', header: 'Total pagos', tipo: 'numero' },
      { campo: 'monto_cobrado', header: 'Monto cobrado', tipo: 'moneda' },
    ],
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'cuotas-por-vencer',
    titulo: 'Cuotas por vencer',
    descripcion: 'Próximas cuotas en los siguientes días.',
    columnas: [
      { campo: 'cliente_nombre', header: 'Cliente', tipo: 'texto' },
      { campo: 'fecha_esperada', header: 'Vencimiento', tipo: 'fecha' },
      { campo: 'valor', header: 'Valor cuota', tipo: 'moneda' },
      { campo: 'cobrador', header: 'Cobrador', tipo: 'texto' },
    ],
    roles: ['admin', 'supervisor', 'cobrador'],
  },
];

export interface ReportesState {
  reporteActivo: TipoReporte | null;
  datos: ReporteResponse | null;
  filtros: FiltrosReporte;
  loading: boolean;
  error: string | null;
}
