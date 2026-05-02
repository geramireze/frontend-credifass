import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { CfProducto, CfProductosFiltros, CrearProductoDto } from './cf-productos.model';

@Injectable({ providedIn: 'root' })
export class CfProductosApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cf/productos`;

  listar(f: CfProductosFiltros = {}): Promise<{ items: CfProducto[]; total: number }> {
    let params = new HttpParams();
    if (f.q)          params = params.set('nombre', f.q);
    if (f.estado)     params = params.set('estado', f.estado);
    if (f.stockBajo)  params = params.set('stockBajo', 'true');
    if (f.categoriaId) params = params.set('categoriaId', f.categoriaId);
    if (f.page)       params = params.set('page', f.page);
    if (f.pageSize)   params = params.set('pageSize', f.pageSize ?? 20);
    return firstValueFrom(this.http.get<{ items: CfProducto[]; total: number }>(this.base, { params }));
  }

  obtener(id: string): Promise<CfProducto> {
    return firstValueFrom(this.http.get<CfProducto>(`${this.base}/${id}`));
  }

  crear(dto: CrearProductoDto): Promise<CfProducto> {
    return firstValueFrom(this.http.post<CfProducto>(this.base, dto));
  }

  actualizarPrecios(id: string, valorCompra: string, valorVenta: string): Promise<CfProducto> {
    return firstValueFrom(this.http.patch<CfProducto>(`${this.base}/${id}/precios`, { valorCompra, valorVenta }));
  }

  actualizar(id: string, dto: { nombre?: string; descripcion?: string; stockMinimo?: number }): Promise<CfProducto> {
    return firstValueFrom(this.http.patch<CfProducto>(`${this.base}/${id}`, dto));
  }

  ajustarStock(id: string, cantidad: number, motivo: string): Promise<CfProducto> {
    return firstValueFrom(this.http.patch<CfProducto>(`${this.base}/${id}/stock`, { cantidad, motivo }));
  }

  inactivar(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }
}
