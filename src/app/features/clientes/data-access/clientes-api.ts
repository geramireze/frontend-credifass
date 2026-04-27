import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClienteListItem, ClienteDetalle, ClientesListResponse, ClientesFiltros, CrearClienteDto } from './clientes.model';

type RawListItem = Record<string, unknown>;

function mapListItem(raw: RawListItem): ClienteListItem {
  return {
    id: raw['id'] as string,
    nombre: raw['nombre'] as string,
    documento: raw['documento'] as string,
    telefono: raw['telefono'] as string,
    ciudad: raw['ciudad'] as string,
    activo: raw['activo'] as boolean,
    estado_efectivo: (raw['estadoEfectivo'] as string ?? 'sin_prestamos') as ClienteListItem['estado_efectivo'],
    prestamos_activos: Number(raw['prestamosActivos'] ?? 0),
    saldo_total: Number(raw['saldoTotal'] ?? 0),
  };
}

function mapDetalle(raw: RawListItem): ClienteDetalle {
  return {
    ...mapListItem(raw),
    direccion: raw['direccion'] as string,
    notas: (raw['notas'] as string | null) ?? null,
    referencias: (raw['referencias'] as ClienteDetalle['referencias']) ?? [],
    historial_mora: Number(raw['historialMora'] ?? 0),
  };
}

@Injectable({
  providedIn: 'root',
})
export class ClientesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clientes`;

  listar(filtros: ClientesFiltros = {}): Promise<ClientesListResponse> {
    let params = new HttpParams();
    if (filtros.q) params = params.set('q', filtros.q);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.page) params = params.set('page', filtros.page);
    if (filtros.pageSize) params = params.set('pageSize', filtros.pageSize);
    if (filtros.sort) params = params.set('sort', filtros.sort);
    return firstValueFrom(
      this.http.get<{ total: number; page: number; pageSize: number; items: RawListItem[] }>(this.base, { params }).pipe(
        map(res => ({ ...res, items: res.items.map(mapListItem) })),
      ),
    );
  }

  obtener(id: string): Promise<ClienteDetalle> {
    return firstValueFrom(
      this.http.get<RawListItem>(`${this.base}/${id}`).pipe(map(mapDetalle)),
    );
  }

  crear(dto: CrearClienteDto): Promise<ClienteDetalle> {
    return firstValueFrom(this.http.post<ClienteDetalle>(this.base, dto));
  }

  actualizar(id: string, dto: Partial<CrearClienteDto>): Promise<ClienteDetalle> {
    return firstValueFrom(this.http.patch<ClienteDetalle>(`${this.base}/${id}`, dto));
  }

  desactivar(id: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/desactivar`, {}));
  }

  reactivar(id: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/reactivar`, {}));
  }
}
