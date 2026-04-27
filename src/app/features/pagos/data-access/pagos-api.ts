import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegistrarPagoDto, PagoRegistrado, RutaHoy } from './pagos.model';

@Injectable({
  providedIn: 'root',
})
export class PagosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  registrar(dto: RegistrarPagoDto): Promise<PagoRegistrado> {
    return firstValueFrom(
      this.http.post<PagoRegistrado>(`${this.base}/prestamos/${dto.prestamo_id}/pagos`, dto, {
        headers: { 'Idempotency-Key': dto.idempotency_key },
      }),
    );
  }

  anular(pagoId: string, motivo: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/pagos/${pagoId}/anular`, { motivo }));
  }

  rutaHoy(): Promise<RutaHoy> {
    return firstValueFrom(this.http.get<RutaHoy>(`${this.base}/cobrador/ruta-hoy`));
  }
}
