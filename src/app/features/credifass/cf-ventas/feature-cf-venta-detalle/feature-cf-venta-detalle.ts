import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfVentasStore } from '../data-access/cf-ventas.store';
import type { CfCuota, MedioPago } from '../data-access/cf-ventas.model';

@Component({
  selector: 'app-feature-cf-venta-detalle',
  imports: [FormsModule, CopPipe, DatePipe],
  templateUrl: './feature-cf-venta-detalle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfVentaDetalle implements OnInit {
  protected readonly store = inject(CfVentasStore);
  private readonly route = inject(ActivatedRoute);

  protected cuotaSeleccionada = signal<CfCuota | null>(null);
  protected montoPago = signal('');
  protected medioPago = signal<MedioPago>('efectivo');
  protected guardando = signal(false);
  protected errorPago = signal<string | null>(null);
  protected exitoPago = signal(false);

  protected readonly mediosPago: { value: MedioPago; label: string }[] = [
    { value: 'efectivo',     label: 'Efectivo' },
    { value: 'transferencia',label: 'Transferencia' },
    { value: 'nequi',        label: 'Nequi' },
    { value: 'daviplata',    label: 'Daviplata' },
    { value: 'otro',         label: 'Otro' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.store.cargarDetalle(id);
  }

  seleccionarCuota(cuota: CfCuota): void {
    this.cuotaSeleccionada.set(cuota);
    this.montoPago.set(cuota.saldoCuota);
    this.errorPago.set(null);
    this.exitoPago.set(false);
  }

  async registrarPago(): Promise<void> {
    const cuota = this.cuotaSeleccionada();
    const venta = this.store.seleccionado();
    if (!cuota || !venta) return;

    this.guardando.set(true);
    this.errorPago.set(null);
    this.exitoPago.set(false);

    try {
      await this.store.registrarPago(venta.id, {
        cuotaId:        cuota.id,
        monto:          this.montoPago(),
        medioPago:      this.medioPago(),
        idempotencyKey: crypto.randomUUID(),
      });
      this.exitoPago.set(true);
      this.cuotaSeleccionada.set(null);
      this.montoPago.set('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el pago.';
      this.errorPago.set(msg);
    } finally {
      this.guardando.set(false);
    }
  }

  estadoCuotaClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'bg-amber-100 text-amber-800',
      vencida:   'bg-red-100 text-red-800',
      pagada:    'bg-green-100 text-green-800',
      parcial:   'bg-blue-100 text-blue-800',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-500';
  }
}
