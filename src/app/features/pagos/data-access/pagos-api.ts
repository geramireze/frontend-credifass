import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegistrarPagoDto, PagoRegistrado, RutaHoy } from './pagos.model';

const API_TIMEOUT_MS = 30_000;

function checkOnline(): void {
  if (!navigator.onLine) {
    throw Object.assign(new Error('Sin conexión a internet'), {
      error: { message: 'Sin conexión a internet. El pago se registrará cuando vuelva la señal.' },
    });
  }
}

@Injectable({
  providedIn: 'root',
})
export class PagosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  registrar(dto: RegistrarPagoDto): Promise<PagoRegistrado> {
    checkOnline();
    const { prestamo_id, idempotency_key, ...body } = dto;
    return firstValueFrom(
      this.http.post<PagoRegistrado>(`${this.base}/prestamos/${prestamo_id}/pagos`, body, {
        headers: { 'Idempotency-Key': idempotency_key },
      }).pipe(timeout(API_TIMEOUT_MS)),
    );
  }

  anular(pagoId: string, motivo: string): Promise<void> {
    checkOnline();
    return firstValueFrom(
      this.http.post<void>(`${this.base}/pagos/${pagoId}/anular`, { motivo }).pipe(timeout(API_TIMEOUT_MS)),
    );
  }

  rutaHoy(): Promise<RutaHoy> {
    return firstValueFrom(
      this.http.get<RutaHoy>(`${this.base}/cobrador/ruta-hoy`).pipe(timeout(API_TIMEOUT_MS)),
    );
  }
}
