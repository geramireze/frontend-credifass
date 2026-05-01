import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { CfCliente, CfClientesFiltros, CrearCfClienteDto } from './cf-clientes.model';

@Injectable({ providedIn: 'root' })
export class CfClientesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cf/clientes`;

  listar(f: CfClientesFiltros = {}): Promise<{ items: CfCliente[]; total: number }> {
    let params = new HttpParams();
    if (f.q)           params = params.set('q', f.q);
    if (f.soloActivos) params = params.set('soloActivos', 'true');
    if (f.page)        params = params.set('page', f.page);
    if (f.pageSize)    params = params.set('pageSize', f.pageSize ?? 20);
    return firstValueFrom(this.http.get<{ items: CfCliente[]; total: number }>(this.base, { params }));
  }

  obtener(id: string): Promise<CfCliente> {
    return firstValueFrom(this.http.get<CfCliente>(`${this.base}/${id}`));
  }

  crear(dto: CrearCfClienteDto): Promise<CfCliente> {
    return firstValueFrom(this.http.post<CfCliente>(this.base, dto));
  }

  actualizar(id: string, dto: Partial<CrearCfClienteDto>): Promise<CfCliente> {
    return firstValueFrom(this.http.patch<CfCliente>(`${this.base}/${id}`, dto));
  }

  inactivar(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }
}
