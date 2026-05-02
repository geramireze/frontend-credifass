import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface VentaCuotaRow {
  id: string;
  numero_venta: string;
  cliente: string;
  tipo: 'cuotas' | 'abono';
  estado: string;
  fecha_venta: string;
  subtotal_venta: string;
  saldo_pendiente: string;
  n_cuotas: number | null;
  intervalo: 'semanal' | 'quincenal' | 'mensual' | 'abono' | null;
  cuotas_pagadas: number;
  cuotas_vencidas: number;
  cuotas_pendientes: number;
  abonos_registrados: number;
}

export interface FiltrosReporteVentas {
  fechaDesde?: string;
  fechaHasta?: string;
  clienteId?: string;
}

@Injectable({ providedIn: 'root' })
export class CfReportesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cf/reportes`;

  ventasCuotas(f: FiltrosReporteVentas = {}): Promise<VentaCuotaRow[]> {
    let params = new HttpParams().set('formato', 'json');
    if (f.fechaDesde) params = params.set('fechaDesde', f.fechaDesde);
    if (f.fechaHasta) params = params.set('fechaHasta', f.fechaHasta);
    if (f.clienteId)  params = params.set('clienteId', f.clienteId);
    return firstValueFrom(
      this.http.get<VentaCuotaRow[]>(`${this.base}/RPT-CF09`, { params }),
    );
  }

  exportarVentasCuotas(f: FiltrosReporteVentas, formato: 'xlsx' | 'pdf'): string {
    const base = `${environment.apiUrl}/cf/reportes/RPT-CF09?formato=${formato}`;
    const p: string[] = [];
    if (f.fechaDesde) p.push(`fechaDesde=${f.fechaDesde}`);
    if (f.fechaHasta) p.push(`fechaHasta=${f.fechaHasta}`);
    if (f.clienteId)  p.push(`clienteId=${f.clienteId}`);
    return p.length ? `${base}&${p.join('&')}` : base;
  }
}
