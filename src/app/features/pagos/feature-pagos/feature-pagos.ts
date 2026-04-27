import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PagosStore } from '../data-access/pagos.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { CuotaRuta, RutaHoy } from '../data-access/pagos.model';

type EstadoCuota = 'pendiente' | 'cobrada' | 'vencida';

const ESTADO_LABELS: Record<EstadoCuota, string> = {
  pendiente: 'Pendiente',
  cobrada: 'Cobrada',
  vencida: 'Vencida',
};

const ESTADO_BADGE: Record<EstadoCuota, string> = {
  pendiente: 'badge badge-pendiente',
  cobrada: 'badge badge-success',
  vencida: 'badge badge-mora',
};

@Component({
  selector: 'app-feature-pagos',
  imports: [ReactiveFormsModule, DatePipe, CopPipe, AppIconComponent],
  templateUrl: './feature-pagos.html',
  styleUrl: './feature-pagos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePagos implements OnInit {
  protected readonly store = inject(PagosStore);
  private readonly fb = inject(FormBuilder);

  protected readonly filtro = signal('');

  protected readonly pagoForm = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(1)]],
    notas: [''],
  });

  ngOnInit(): void {
    this.store.cargarRuta();
  }

  protected cuotasFiltradas(cuotas: CuotaRuta[]): CuotaRuta[] {
    const q = this.filtro().trim().toLowerCase();
    if (!q) return cuotas;
    return cuotas.filter(
      (c) =>
        c.cliente_nombre.toLowerCase().includes(q) ||
        c.cliente_documento.includes(q),
    );
  }

  protected cuotasPendientesCount(ruta: RutaHoy): number {
    return ruta.cuotas.filter((c) => c.estado !== 'cobrada').length;
  }

  protected estadoCuotaLabel(estado: string): string {
    return ESTADO_LABELS[estado as EstadoCuota] ?? estado;
  }

  protected estadoCuotaBadge(estado: string): string {
    return ESTADO_BADGE[estado as EstadoCuota] ?? 'badge';
  }

  protected seleccionarCuota(cuota: CuotaRuta): void {
    this.store.seleccionarCuota(cuota);
    this.pagoForm.patchValue({ monto: cuota.valor + cuota.mora_acumulada });
    this.pagoForm.get('notas')?.reset('');
  }

  protected async registrarPago(): Promise<void> {
    const cuota = this.store.cuotaSeleccionada();
    if (!cuota || this.pagoForm.invalid) return;

    await this.store.registrarPago({
      prestamo_id: cuota.prestamo_id,
      monto: this.pagoForm.getRawValue().monto,
      fecha: new Date().toISOString().split('T')[0],
      nota: this.pagoForm.getRawValue().notas || undefined,
      idempotency_key: crypto.randomUUID(),
    });

    if (!this.store.error()) {
      this.pagoForm.reset({ monto: 0, notas: '' });
    }
  }

  protected cancelarPago(): void {
    this.store.cancelarSeleccion();
    this.pagoForm.reset({ monto: 0, notas: '' });
  }
}
