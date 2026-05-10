import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfClientesApi } from '../data-access/cf-clientes-api';
import { CfVentasApi } from '../../cf-ventas/data-access/cf-ventas-api';
import type { CfAbonoCliente, CfCliente, CfProductoComprado } from '../data-access/cf-clientes.model';
import type { CfVenta } from '../../cf-ventas/data-access/cf-ventas.model';

@Component({
  selector: 'app-feature-cf-cliente-detalle',
  imports: [RouterLink, DatePipe, CopPipe],
  templateUrl: './feature-cf-cliente-detalle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfClienteDetalle implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly clientesApi = inject(CfClientesApi);
  private readonly ventasApi   = inject(CfVentasApi);
  protected readonly location  = inject(Location);

  protected cliente   = signal<CfCliente | null>(null);
  protected ventas    = signal<CfVenta[]>([]);
  protected productos = signal<CfProductoComprado[]>([]);
  protected abonos    = signal<CfAbonoCliente[]>([]);
  protected loading   = signal(true);
  protected error     = signal<string | null>(null);
  protected tabActivo = signal<'datos' | 'ventas' | 'productos' | 'abonos'>('datos');

  protected get totalVentas(): number    { return this.ventas().length; }
  protected get totalVenta(): number     { return this.ventas().reduce((s, v) => s + (+v.subtotalVenta), 0); }
  protected get totalPagado(): number    { return this.ventas().reduce((s, v) => s + (+v.totalPagado), 0); }
  protected get saldoTotal(): number     { return this.ventas().reduce((s, v) => s + (+v.saldoPendiente), 0); }
  protected get totalProductos(): number { return this.productos().reduce((s, p) => s + p.totalCantidad, 0); }
  protected get totalAbonos(): number    { return this.abonos().reduce((s, a) => s + (+a.monto), 0); }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const [cliente, res] = await Promise.all([
        this.clientesApi.obtener(id),
        this.ventasApi.listar({ clienteId: id, pageSize: 100 }),
      ]);
      this.cliente.set(cliente);
      this.ventas.set(res.items);
    } catch {
      this.error.set('No se pudo cargar el cliente.');
    } finally {
      this.loading.set(false);
    }
    // Load these independently — endpoints may not exist in production yet
    this.clientesApi.obtenerProductosComprados(id)
      .then(p => this.productos.set(p))
      .catch(() => {});
    this.clientesApi.obtenerAbonos(id)
      .then(a => this.abonos.set(a))
      .catch(() => {});
  }

  estadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      activa:  'bg-blue-100 text-blue-800',
      pagada:  'bg-green-100 text-green-800',
      anulada: 'bg-gray-100 text-gray-500',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-500';
  }
}
