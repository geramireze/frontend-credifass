import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { CfCategoria } from './cf-categorias.model';

@Injectable({ providedIn: 'root' })
export class CfCategoriasApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cf/categorias`;

  listar(soloActivas = true): Promise<CfCategoria[]> {
    return firstValueFrom(this.http.get<CfCategoria[]>(this.base, { params: { soloActivas } }));
  }

  crear(dto: { nombre: string; descripcion?: string }): Promise<CfCategoria> {
    return firstValueFrom(this.http.post<CfCategoria>(this.base, dto));
  }

  actualizar(id: string, dto: { nombre?: string; descripcion?: string; activo?: boolean }): Promise<CfCategoria> {
    return firstValueFrom(this.http.patch<CfCategoria>(`${this.base}/${id}`, dto));
  }
}
