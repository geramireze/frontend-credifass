export interface CierreDatos {
  prestamos: {
    nuevos:         number;
    monto_prestado: number;
    pagos_count:    number;
    pagos_monto:    number;
  };
  credifass: {
    ventas_count:  number;
    ventas_monto:  number;
    abonos_count:  number;
    abonos_monto:  number;
  };
  cartera: {
    prestamos_pendiente: number;
    credifass_pendiente: number;
    total_pendiente:     number;
  };
}

export interface CierreSemana {
  id:            string;
  fechaDesde:    string;
  fechaHasta:    string;
  datos:         CierreDatos;
  generadoPorId: string;
  createdAt:     string;
}

export interface CierresState {
  items:          CierreSemana[];
  seleccionado:   CierreSemana | null;
  loading:        boolean;
  guardando:      boolean;
  error:          string | null;
  diasRestantes:  number | null;
  proximoCierre:  string | null;
}
