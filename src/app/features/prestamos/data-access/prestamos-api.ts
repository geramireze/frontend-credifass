import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PrestamosListResponse, PrestamoListItem, CuotaPrestamo,
  SimulacionRequest, SimulacionResponse, CrearPrestamoDto, EditarPrestamoDto, PrestamosFiltros,
} from './prestamos.model';

type RawPrestamo = Record<string, unknown> & {
  cliente?: Record<string, unknown>;
  cobrador?: Record<string, unknown> | null;
};

function mapCuota(raw: Record<string, unknown>): CuotaPrestamo {
  return {
    id: raw['id'] as string,
    numero: raw['numero'] as number,
    fecha_esperada: raw['fechaEsperada'] as string,
    valor: Number(raw['valor']),
    pagado: Number(raw['pagado'] ?? 0),
    mora_acumulada: Number(raw['moraAcumulada'] ?? 0),
    estado: raw['estado'] as 'pendiente' | 'pagada' | 'vencida',
  };
}

function mapPrestamo(raw: RawPrestamo): PrestamoListItem {
  return {
    id: raw['id'] as string,
    cliente_id: raw['clienteId'] as string,
    cliente_nombre: (raw['cliente'] as Record<string, string>)?.['nombre'] ?? '',
    cobrador_id: (raw['cobradorId'] as string | null) ?? null,
    cobrador_nombre: (raw['cobrador'] as Record<string, string> | null)?.['nombre'] ?? null,
    monto_prestado: Number(raw['montoPrestado']),
    monto_total: Number(raw['montoTotal']),
    cuota_semanal: Number(raw['cuotaSemanal']),
    numero_semanas: raw['numeroSemanas'] as number,
    fecha_inicio: raw['fechaInicio'] as string,
    fecha_vencimiento: raw['fechaVencimiento'] as string,
    estado: raw['estado'] as PrestamoListItem['estado'],
    saldo_pendiente: Number(raw['saldoPendiente'] ?? raw['saldo_pendiente'] ?? 0),
    mora_acumulada: Number(raw['moraAcumulada'] ?? raw['mora_acumulada'] ?? 0),
    frecuencia_pago: (raw['frecuenciaPago'] as 'semanal' | 'quincenal') ?? 'semanal',
    cuotas_pagadas: Number(raw['cuotasPagadas'] ?? 0),
  };
}

@Injectable({
  providedIn: 'root',
})
export class PrestamosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/prestamos`;

  listar(filtros: PrestamosFiltros = {}): Promise<PrestamosListResponse> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined) params = params.set(k, String(v)); });
    return firstValueFrom(
      this.http.get<RawPrestamo[] | { items: RawPrestamo[]; total: number }>(this.base, { params }).pipe(
        map(res => {
          const raw = Array.isArray(res) ? res : res.items;
          const items = raw.map(mapPrestamo);
          return { items, total: items.length };
        }),
      ),
    );
  }

  obtener(id: string): Promise<PrestamoListItem> {
    return firstValueFrom(
      this.http.get<RawPrestamo>(`${this.base}/${id}`).pipe(map(mapPrestamo)),
    );
  }

  crear(dto: CrearPrestamoDto): Promise<PrestamoListItem> {
    return firstValueFrom(this.http.post<PrestamoListItem>(this.base, dto));
  }

  simular(dto: SimulacionRequest): Promise<SimulacionResponse> {
    return firstValueFrom(this.http.post<SimulacionResponse>(`${this.base}/simular`, dto));
  }

  cuotas(id: string): Promise<CuotaPrestamo[]> {
    return firstValueFrom(
      this.http.get<Record<string, unknown>[]>(`${this.base}/${id}/cuotas`).pipe(map(res => res.map(mapCuota))),
    );
  }

  editar(id: string, dto: EditarPrestamoDto): Promise<PrestamoListItem> {
    return firstValueFrom(
      this.http.patch<RawPrestamo>(`${this.base}/${id}`, dto).pipe(map(mapPrestamo)),
    );
  }

  cancelar(id: string, motivo?: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/cancelar`, { motivo }));
  }
}
