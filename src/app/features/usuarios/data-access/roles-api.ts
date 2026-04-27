import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Rol, CrearRolDto } from './usuarios.model';

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/roles`;

  listar(): Promise<Rol[]> {
    return firstValueFrom(this.http.get<Rol[]>(this.base));
  }

  crear(dto: CrearRolDto): Promise<Rol> {
    return firstValueFrom(this.http.post<Rol>(this.base, dto));
  }

  actualizarPermisos(id: string, permissions: Record<string, boolean>): Promise<Rol> {
    return firstValueFrom(this.http.patch<Rol>(`${this.base}/${id}/permissions`, { permissions }));
  }

  eliminar(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }
}
