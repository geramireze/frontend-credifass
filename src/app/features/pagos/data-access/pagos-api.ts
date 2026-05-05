import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegistrarPagoDto, PagoRegistrado, RutaHoy } from './pagos.model';
import { OfflineCache } from '../../../core/offline/offline-cache';
import { OfflineQueue } from '../../../core/offline/offline-queue';

const API_TIMEOUT_MS = 30_000;
const CACHE_RUTA_KEY = 'pagos_ruta_hoy';

@Injectable({ providedIn: 'root' })
export class PagosApiService {
  private readonly http   = inject(HttpClient);
  private readonly cache  = inject(OfflineCache);
  private readonly queue  = inject(OfflineQueue);
  private readonly base   = `${environment.apiUrl}`;

  async registrar(dto: RegistrarPagoDto): Promise<PagoRegistrado> {
    const { prestamo_id, idempotency_key, ...body } = dto;
    const url = `${this.base}/prestamos/${prestamo_id}/pagos`;
    const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');

    if (!navigator.onLine) {
      this.queue.enqueue(url, 'POST', body, {
        'Idempotency-Key': idempotency_key,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      });
      // Devolvemos un objeto provisional para que el store sepa que se encoló
      return { id: idempotency_key, offline: true } as unknown as PagoRegistrado;
    }

    return firstValueFrom(
      this.http.post<PagoRegistrado>(url, body, {
        headers: { 'Idempotency-Key': idempotency_key },
      }).pipe(timeout(API_TIMEOUT_MS)),
    );
  }

  anular(pagoId: string, motivo: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/pagos/${pagoId}/anular`, { motivo }).pipe(timeout(API_TIMEOUT_MS)),
    );
  }

  async rutaHoy(): Promise<RutaHoy> {
    try {
      const ruta = await firstValueFrom(
        this.http.get<RutaHoy>(`${this.base}/cobrador/ruta-hoy`).pipe(timeout(API_TIMEOUT_MS)),
      );
      this.cache.set(CACHE_RUTA_KEY, ruta);
      return ruta;
    } catch {
      const cached = this.cache.getStale<RutaHoy>(CACHE_RUTA_KEY);
      if (cached) return cached;
      throw new Error('Sin conexión y sin datos cacheados para la ruta de hoy.');
    }
  }
}
