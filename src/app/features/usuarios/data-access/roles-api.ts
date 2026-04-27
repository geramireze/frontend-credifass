import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Rol } from './usuarios.model';

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/roles`;

  listar(): Promise<Rol[]> {
    return firstValueFrom(this.http.get<Rol[]>(this.base));
  }

  actualizarPermisos(id: string, permissions: Record<string, boolean>): Promise<Rol> {
    return firstValueFrom(this.http.patch<Rol>(`${this.base}/${id}/permissions`, { permissions }));
  }
}
