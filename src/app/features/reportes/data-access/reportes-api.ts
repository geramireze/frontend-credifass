import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TipoReporte, FiltrosReporte, ReporteResponse } from './reportes.model';

const ENDPOINT_MAP: Record<TipoReporte, string> = {
  'clientes-al-dia': '/reportes/clientes-al-dia',
  'clientes-mora': '/reportes/clientes-mora',
  'prestamos-activos': '/reportes/prestamos-activos',
  'prestamos-pagados': '/reportes/prestamos-pagados',
  ganancias: '/reportes/ganancias',
  'capital-prestado': '/reportes/capital-prestado',
  'utilidad-neta': '/reportes/utilidad-neta',
  'pagos-cobrador': '/reportes/pagos-cobrador',
  'cuotas-por-vencer': '/reportes/cuotas-por-vencer',
};

@Injectable({
  providedIn: 'root',
})
export class ReportesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  obtener(tipo: TipoReporte, filtros: FiltrosReporte = {}): Promise<ReporteResponse> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined && v !== '') params = params.set(k, String(v)); });
    return firstValueFrom(
      this.http.get<ReporteResponse>(`${this.base}${ENDPOINT_MAP[tipo]}`, { params }),
    );
  }
}
