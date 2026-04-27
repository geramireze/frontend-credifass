import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UsuarioListItem, CrearUsuarioDto, CrearUsuarioResponse, EditarUsuarioDto } from './usuarios.model';

@Injectable({
  providedIn: 'root',
})
export class UsuariosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  listar(): Promise<{ items: UsuarioListItem[]; total: number }> {
    return firstValueFrom(this.http.get<{ items: UsuarioListItem[]; total: number }>(this.base));
  }

  crear(dto: CrearUsuarioDto): Promise<CrearUsuarioResponse> {
    return firstValueFrom(this.http.post<CrearUsuarioResponse>(this.base, dto));
  }

  editar(id: string, dto: EditarUsuarioDto): Promise<UsuarioListItem> {
    return firstValueFrom(this.http.patch<UsuarioListItem>(`${this.base}/${id}`, dto));
  }

  desactivar(id: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/desactivar`, {}));
  }

  reactivar(id: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/reactivar`, {}));
  }

  resetPassword(id: string): Promise<{ password_temporal: string }> {
    return firstValueFrom(this.http.post<{ password_temporal: string }>(`${this.base}/${id}/reset-password`, {}));
  }
}
