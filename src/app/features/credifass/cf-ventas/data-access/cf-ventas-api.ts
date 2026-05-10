import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type {
  ActualizarVentaDto,
  CfVenta,
  CfVentasFiltros,
  CrearVentaDto,
  RegistrarPagoDto,
  RegistrarAbonoDto,
  SimulacionCuotas,
  CfCuota,
  CfPagoCuota,
  CfAbonoVenta,
} from './cf-ventas.model';

@Injectable({ providedIn: 'root' })
export class CfVentasApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cf/ventas`;

  simular(totalVenta: string, nCuotas: number, fechaInicio: string, intervalo: string): Promise<SimulacionCuotas> {
    const params = new HttpParams()
      .set('total', totalVenta)
      .set('nCuotas', nCuotas)
      .set('fechaInicio', fechaInicio)
      .set('intervalo', intervalo);
    return firstValueFrom(this.http.get<SimulacionCuotas>(`${this.base}/simular`, { params }));
  }

  listar(f: CfVentasFiltros = {}): Promise<{ items: CfVenta[]; total: number }> {
    let params = new HttpParams();
    if (f.q)          params = params.set('q', f.q);
    if (f.tipo)       params = params.set('tipo', f.tipo);
    if (f.estado)     params = params.set('estado', f.estado);
    if (f.fechaDesde) params = params.set('fechaDesde', f.fechaDesde);
    if (f.fechaHasta) params = params.set('fechaHasta', f.fechaHasta);
    if (f.clienteId)  params = params.set('clienteId', f.clienteId);
    if (f.page)       params = params.set('page', f.page);
    if (f.pageSize)   params = params.set('pageSize', f.pageSize ?? 20);
    return firstValueFrom(
      this.http.get<{ items: any[]; total: number }>(this.base, { params }).pipe(
        map(res => ({
          total: res.total,
          items: res.items.map((v) => ({
            ...v,
            clienteNombre: v.cliente?.nombre ?? '',
            numeroVenta: v.numero != null ? String(v.numero) : '',
          } as CfVenta)),
        })),
      ),
    );
  }

  obtener(id: string): Promise<CfVenta> {
    return firstValueFrom(
      this.http.get<any>(`${this.base}/${id}`).pipe(
        map((v) => ({
          ...v,
          clienteNombre: v.cliente?.nombre ?? '',
          numeroVenta: v.numero != null ? String(v.numero) : '',
          lineas: (v.detalles ?? []).map((d: any) => ({
            id: d.id,
            productoId: d.productoId,
            productoNombre: d.producto?.nombre ?? '',
            cantidad: d.cantidad,
            valorCompraUnitario: d.valorCompraUnitario,
            valorVentaUnitario: d.valorVentaUnitario,
            gananciaUnitaria: d.gananciaUnitaria,
            gananciaLinea: d.gananciaLinea,
          })),
        } as CfVenta)),
      ),
    );
  }

  obtenerCuotas(id: string): Promise<CfCuota[]> {
    return firstValueFrom(this.http.get<CfCuota[]>(`${this.base}/${id}/cuotas`));
  }

  obtenerPagos(id: string): Promise<CfPagoCuota[]> {
    return firstValueFrom(this.http.get<CfPagoCuota[]>(`${this.base}/${id}/pagos`));
  }

  actualizar(id: string, dto: ActualizarVentaDto): Promise<CfVenta> {
    return firstValueFrom(this.http.patch<CfVenta>(`${this.base}/${id}`, dto));
  }

  crear(dto: CrearVentaDto): Promise<CfVenta> {
    return firstValueFrom(this.http.post<CfVenta>(this.base, dto));
  }

  registrarPago(ventaId: string, dto: RegistrarPagoDto): Promise<CfPagoCuota> {
    return firstValueFrom(
      this.http.post<CfPagoCuota>(`${this.base}/${ventaId}/pagos`, dto, {
        headers: { 'Idempotency-Key': dto.idempotencyKey },
      }),
    );
  }

  anularPago(pagoId: string, motivo: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/pagos/${pagoId}/anular`, { motivo }));
  }

  anularAbono(abonoId: string, motivo: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/abonos/${abonoId}/anular`, { motivo }));
  }

  anular(id: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/anular`, {}));
  }

  listarAbonos(ventaId: string): Promise<CfAbonoVenta[]> {
    return firstValueFrom(this.http.get<CfAbonoVenta[]>(`${this.base}/${ventaId}/abonos`));
  }

  registrarAbono(ventaId: string, dto: RegistrarAbonoDto, idempotencyKey: string): Promise<CfAbonoVenta> {
    return firstValueFrom(
      this.http.post<CfAbonoVenta>(`${this.base}/${ventaId}/abonos`, dto, {
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    );
  }
}
