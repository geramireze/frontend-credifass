import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { CfReserva, CfReservasFiltros, CrearReservaDto, RegistrarAbonoDto, CfAbonoReserva } from './cf-reservas.model';

@Injectable({ providedIn: 'root' })
export class CfReservasApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cf/reservas`;

  listar(f: CfReservasFiltros = {}): Promise<{ items: CfReserva[]; total: number }> {
    let params = new HttpParams();
    if (f.q)       params = params.set('q', f.q);
    if (f.estado)  params = params.set('estado', f.estado);
    if (f.page)    params = params.set('page', f.page);
    if (f.pageSize) params = params.set('pageSize', f.pageSize ?? 20);
    return firstValueFrom(
      this.http.get<{ items: any[]; total: number }>(this.base, { params }).pipe(
        map(res => ({
          total: res.total,
          items: res.items.map((r) => ({
            ...r,
            clienteNombre:         r.cliente?.nombre ?? '',
            productoNombre:        r.producto?.nombre ?? '',
            numeroReserva:         r.numero != null ? String(r.numero) : '',
            precioAcordado:        r.valorVentaUnitario ?? '',
            notas:                 r.observaciones ?? null,
            fechaEntregaEstimada:  r.fechaEstimadaEntrega ?? null,
          } as CfReserva)),
        })),
      ),
    );
  }

  obtener(id: string): Promise<CfReserva> {
    return firstValueFrom(this.http.get<CfReserva>(`${this.base}/${id}`));
  }

  crear(dto: CrearReservaDto): Promise<CfReserva> {
    return firstValueFrom(this.http.post<CfReserva>(this.base, dto));
  }

  registrarAbono(id: string, dto: RegistrarAbonoDto): Promise<CfAbonoReserva> {
    return firstValueFrom(
      this.http.post<CfAbonoReserva>(`${this.base}/${id}/abonos`, dto, {
        headers: { 'Idempotency-Key': dto.idempotencyKey },
      }),
    );
  }

  anularAbono(id: string, abonoId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}/abonos/${abonoId}`));
  }

  cancelar(id: string, motivo: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/cancelar`, { motivo }));
  }

  entregar(id: string, planCuotas?: { nCuotas: number; fechaInicio: string; intervalo: string }): Promise<CfReserva> {
    return firstValueFrom(this.http.post<CfReserva>(`${this.base}/${id}/entregar`, planCuotas ?? {}));
  }
}
