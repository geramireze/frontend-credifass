import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditoriaFiltros, AuditoriaResponse } from './auditoria.model';

@Injectable({
  providedIn: 'root',
})
export class AuditoriaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auditoria`;

  listar(filtros: AuditoriaFiltros = {}): Promise<AuditoriaResponse> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined && v !== '') params = params.set(k, String(v)); });
    return firstValueFrom(this.http.get<AuditoriaResponse>(this.base, { params }));
  }
}
