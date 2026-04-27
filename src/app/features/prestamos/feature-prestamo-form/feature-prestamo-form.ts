import {
  ChangeDetectionStrategy, Component, OnInit, OnDestroy,
  inject, signal, computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, startWith, takeUntil } from 'rxjs';
import { PrestamosStore } from '../data-access/prestamos.store';
import { ClientesApiService } from '../../clientes/data-access/clientes-api';
import { ClienteListItem } from '../../clientes/data-access/clientes.model';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { SimulacionRequest, FrecuenciaPago } from '../data-access/prestamos.model';

// Tasa fija del sistema: 20% total sobre 6 semanas → 3.333% por semana
const TASA_SEMANAL_FIJA = 0.20 / 6;
const SEMANAS_FIJAS = 6;

@Component({
  selector: 'app-feature-prestamo-form',
  imports: [ReactiveFormsModule, RouterLink, CopPipe, AppIconComponent],
  templateUrl: './feature-prestamo-form.html',
  styleUrl: './feature-prestamo-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePrestamoForm implements OnInit, OnDestroy {
  protected readonly store = inject(PrestamosStore);
  private readonly clientesApi = inject(ClientesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly clientes = signal<ClienteListItem[]>([]);

  protected readonly hoy = new Date().toISOString().split('T')[0];
  protected readonly maxFecha = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  protected readonly form = this.fb.group({
    cliente_id:      ['', [Validators.required]],
    cobrador_id:     [''],
    monto_prestado:  [null as number | null, [Validators.required, Validators.min(50000)]],
    fecha_inicio:    ['', [Validators.required]],
    frecuencia_pago: ['semanal' as FrecuenciaPago],
    mora_activa:     [false],
    notas:           [''],
  });

  protected readonly simulacion = computed(() => this.store.simulacion());
  protected readonly loadingSimulacion = computed(() => this.store.loadingSimulacion());

  protected readonly frecuencia = toSignal(
    this.form.get('frecuencia_pago')!.valueChanges.pipe(
      startWith(this.form.get('frecuencia_pago')!.value),
    ),
    { initialValue: 'semanal' as FrecuenciaPago },
  );

  protected readonly nCuotas = computed(() =>
    this.frecuencia() === 'quincenal' ? 3 : 6,
  );

  ngOnInit(): void {
    const clienteId = this.route.snapshot.queryParamMap.get('cliente_id');
    if (clienteId) this.form.patchValue({ cliente_id: clienteId });
    this.form.patchValue({ fecha_inicio: this.hoy });

    this.clientesApi.listar({ pageSize: 100 })
      .then((res) => this.clientes.set(res.items))
      .catch(() => {/* non-critical */});

    const simFields = ['monto_prestado', 'fecha_inicio', 'frecuencia_pago'];
    simFields.forEach((f) => {
      this.form.get(f)?.valueChanges
        .pipe(debounceTime(400), takeUntil(this.destroy$))
        .subscribe(() => this.simular());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.limpiarSimulacion();
  }

  protected async simular(): Promise<void> {
    const { monto_prestado, fecha_inicio, frecuencia_pago } = this.form.value;
    if (!monto_prestado || !fecha_inicio) return;
    const dto: SimulacionRequest = {
      montoPrestado: Number(monto_prestado),
      tasaSemanal: TASA_SEMANAL_FIJA,
      numeroSemanas: SEMANAS_FIJAS,
      modoInteres: 'simple',
      fechaInicio: fecha_inicio,
      frecuenciaPago: (frecuencia_pago as FrecuenciaPago) ?? 'semanal',
    };
    try { await this.store.simular(dto); } catch { /* ignored */ }
  }

  protected async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.simulacion()) return;
    this.loading.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const dto = {
      clienteId:      v.cliente_id!,
      cobradorId:     v.cobrador_id || undefined,
      montoPrestado:  Number(v.monto_prestado),
      tasaSemanal:    TASA_SEMANAL_FIJA,
      numeroSemanas:  SEMANAS_FIJAS,
      modoInteres:    'simple' as const,
      fechaInicio:    v.fecha_inicio!,
      frecuenciaPago: (v.frecuencia_pago as FrecuenciaPago) ?? 'semanal',
      moraActiva:     v.mora_activa ?? false,
      observaciones:  v.notas || undefined,
    };
    try {
      const id = await this.store.crear(dto);
      await this.router.navigate(['/prestamos', id]);
    } catch {
      this.error.set('No se pudo crear el préstamo. Verifica los datos e intenta de nuevo.');
      this.loading.set(false);
    }
  }

  protected campo(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  protected formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
}
