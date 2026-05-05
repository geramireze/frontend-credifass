import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfVentasStore } from '../data-access/cf-ventas.store';
import type { ActualizarVentaDto, CfCuota, MedioPago, RegistrarAbonoDto } from '../data-access/cf-ventas.model';

@Component({
  selector: 'app-feature-cf-venta-detalle',
  imports: [FormsModule, CopPipe, DatePipe],
  templateUrl: './feature-cf-venta-detalle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfVentaDetalle implements OnInit {
  protected readonly Number = Number;
  protected readonly String = String;
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

  // ── Editar venta ──────────────────────────────────────────────────────────
  protected editando          = signal(false);
  protected editTipo          = signal<'contado' | 'abono'>('contado');
  protected editFechaVenta    = signal('');
  protected editObservaciones = signal('');
  protected guardandoEdit     = signal(false);
  protected errorEdit         = signal<string | null>(null);

  abrirEditor(): void {
    const v = this.store.seleccionado();
    if (!v) return;
    if (v.tipo !== 'cuotas') this.editTipo.set(v.tipo as 'contado' | 'abono');
    this.editFechaVenta.set(v.fechaVenta);
    this.editObservaciones.set(v.observaciones ?? '');
    this.errorEdit.set(null);
    this.editando.set(true);
  }

  cancelarEditor(): void {
    this.editando.set(false);
    this.errorEdit.set(null);
  }

  async guardarEdicion(): Promise<void> {
    const venta = this.store.seleccionado();
    if (!venta) return;

    this.guardandoEdit.set(true);
    this.errorEdit.set(null);

    try {
      const dto: ActualizarVentaDto = {
        fechaVenta:    this.editFechaVenta(),
        observaciones: this.editObservaciones() || null,
      };
      if (venta.tipo !== 'cuotas') dto.tipo = this.editTipo();

      await this.store.actualizar(venta.id, dto);
      this.editando.set(false);
    } catch (err: unknown) {
      const msg = (err as { error?: { message?: string } })?.error?.message
        ?? (err instanceof Error ? err.message : 'Error al actualizar la venta.');
      this.errorEdit.set(msg);
    } finally {
      this.guardandoEdit.set(false);
    }
  }

  // ── Abonos ────────────────────────────────────────────────────────────────
  private readonly hoy = new Date().toISOString().split('T')[0];

  protected montoAbono     = signal('');
  protected medioPagoAbono = signal<MedioPago>('efectivo');
  protected notaAbono      = signal('');
  protected fechaAbono     = signal(this.hoy);
  protected guardandoAbono = signal(false);
  protected errorAbono     = signal<string | null>(null);
  protected exitoAbono     = signal(false);

  async registrarAbono(): Promise<void> {
    const venta = this.store.seleccionado();
    const monto = this.montoAbono().trim();
    if (!venta || !monto) return;

    this.guardandoAbono.set(true);
    this.errorAbono.set(null);
    this.exitoAbono.set(false);

    try {
      const dto: RegistrarAbonoDto = {
        monto,
        medioPago:  this.medioPagoAbono(),
        nota:       this.notaAbono() || undefined,
        fechaAbono: this.fechaAbono(),
      };
      await this.store.registrarAbono(venta.id, dto);
      this.exitoAbono.set(true);
      this.montoAbono.set('');
      this.notaAbono.set('');
      this.fechaAbono.set(this.hoy);
    } catch (err: unknown) {
      this.errorAbono.set(err instanceof Error ? err.message : 'Error al registrar el abono.');
    } finally {
      this.guardandoAbono.set(false);
    }
  }
}
