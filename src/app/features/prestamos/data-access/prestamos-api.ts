import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PrestamosListResponse, PrestamoListItem, CuotaPrestamo,
  SimulacionRequest, SimulacionResponse, CrearPrestamoDto, EditarPrestamoDto, PrestamosFiltros,
} from './prestamos.model';
import { OfflineCache } from '../../../core/offline/offline-cache';

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
  private readonly http  = inject(HttpClient);
  private readonly cache = inject(OfflineCache);
  private readonly base  = `${environment.apiUrl}/prestamos`;

  async listar(filtros: PrestamosFiltros = {}): Promise<PrestamosListResponse> {
    const cacheKey = `prestamos_list_${JSON.stringify(filtros)}`;
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined) params = params.set(k, String(v)); });
    try {
      const res = await firstValueFrom(
        this.http.get<RawPrestamo[] | { items: RawPrestamo[]; total: number }>(this.base, { params }).pipe(
          map(r => {
            const raw = Array.isArray(r) ? r : r.items;
            const items = raw.map(mapPrestamo);
            return { items, total: Array.isArray(r) ? items.length : (r as { total: number }).total };
          }),
        ),
      );
      this.cache.set(cacheKey, res);
      return res;
    } catch {
      const cached = this.cache.getStale<PrestamosListResponse>(cacheKey);
      if (cached) return cached;
      throw new Error('Sin conexión y sin datos cacheados de préstamos.');
    }
  }

  async obtener(id: string): Promise<PrestamoListItem> {
    const cacheKey = `prestamo_${id}`;
    try {
      const res = await firstValueFrom(
        this.http.get<RawPrestamo>(`${this.base}/${id}`).pipe(map(mapPrestamo)),
      );
      this.cache.set(cacheKey, res);
      return res;
    } catch {
      const cached = this.cache.getStale<PrestamoListItem>(cacheKey);
      if (cached) return cached;
      throw new Error('Sin conexión y sin datos cacheados del préstamo.');
    }
  }

  crear(dto: CrearPrestamoDto): Promise<PrestamoListItem> {
    return firstValueFrom(this.http.post<PrestamoListItem>(this.base, dto));
  }

  simular(dto: SimulacionRequest): Promise<SimulacionResponse> {
    return firstValueFrom(this.http.post<SimulacionResponse>(`${this.base}/simular`, dto));
  }

  async cuotas(id: string): Promise<CuotaPrestamo[]> {
    const cacheKey = `prestamo_cuotas_${id}`;
    try {
      const res = await firstValueFrom(
        this.http.get<Record<string, unknown>[]>(`${this.base}/${id}/cuotas`).pipe(map(r => r.map(mapCuota))),
      );
      this.cache.set(cacheKey, res);
      return res;
    } catch {
      return this.cache.getStale<CuotaPrestamo[]>(cacheKey) ?? [];
    }
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
