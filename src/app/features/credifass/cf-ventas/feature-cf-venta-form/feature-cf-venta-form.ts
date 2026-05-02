import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AppIconComponent } from '../../../../shared/components/icon/icon';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfVentasStore } from '../data-access/cf-ventas.store';
import { ClientesApiService } from '../../../clientes/data-access/clientes-api';
import { CfProductosApi } from '../../cf-productos/data-access/cf-productos-api';
import type { ClienteListItem } from '../../../clientes/data-access/clientes.model';
import type { CfProducto } from '../../cf-productos/data-access/cf-productos.model';
import type { IntervaloVenta } from '../data-access/cf-ventas.model';

@Component({
  selector: 'app-feature-cf-venta-form',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent, CopPipe, DatePipe],
  templateUrl: './feature-cf-venta-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfVentaForm implements OnInit {
  protected readonly store        = inject(CfVentasStore);
  private readonly router         = inject(Router);
  private readonly fb             = inject(FormBuilder);
  private readonly clientesApi    = inject(ClientesApiService);
  private readonly productosApi   = inject(CfProductosApi);

  protected readonly guardando    = signal(false);
  protected readonly error        = signal<string | null>(null);
  protected readonly productos    = signal<CfProducto[]>([]);
  protected readonly simulando    = signal(false);

  // Buscador de clientes
  protected readonly busquedaCliente   = signal('');
  protected readonly clientesFiltrados = signal<ClienteListItem[]>([]);
  protected readonly clienteSeleccionado = signal<ClienteListItem | null>(null);
  protected readonly buscando          = signal(false);
  protected readonly mostrarDropdown   = signal(false);
  protected readonly inputFocused      = signal(false);

  protected readonly intervalos: { value: IntervaloVenta; label: string }[] = [
    { value: 'semanal',   label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual',   label: 'Mensual' },
  ];

  protected readonly form = this.fb.group({
    clienteId:  ['', Validators.required],
    tipo:       ['contado', Validators.required],
    reservaId:  [''],
    notas:      [''],
    lineas: this.fb.array([this.nuevaLinea()]),
    planCuotas: this.fb.group({
      nCuotas:     [4, [Validators.required, Validators.min(1), Validators.max(52)]],
      fechaInicio: ['', Validators.required],
      intervalo:   ['semanal' as IntervaloVenta, Validators.required],
    }),
  });

  get lineas(): FormArray { return this.form.get('lineas') as FormArray; }
  get tipo(): string { return this.form.get('tipo')?.value ?? 'contado'; }
  protected readonly simulacion = this.store.simulacion;

  private readonly tipoSignal = toSignal(
    this.form.get('tipo')!.valueChanges,
    { initialValue: 'contado' as string },
  );
  protected readonly esCuotas = computed(() => this.tipoSignal() === 'cuotas');
  protected readonly esAbono  = computed(() => this.tipoSignal() === 'abono');

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    const hoy = new Date().toISOString().slice(0, 10);
    this.form.get('planCuotas.fechaInicio')?.setValue(hoy);

    const productos = await this.productosApi
      .listar({ estado: 'disponible', pageSize: 200 })
      .then(r => r.items)
      .catch(() => []);
    this.productos.set(productos);
  }

  protected onBusquedaInput(valor: string): void {
    this.busquedaCliente.set(valor);
    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (!valor.trim()) {
      this.clientesFiltrados.set([]);
      this.mostrarDropdown.set(false);
      return;
    }

    this.searchTimer = setTimeout(async () => {
      this.buscando.set(true);
      try {
        const res = await this.clientesApi.listar({ q: valor.trim(), pageSize: 10 });
        this.clientesFiltrados.set(res.items);
        this.mostrarDropdown.set(true);
      } catch {
        this.clientesFiltrados.set([]);
      } finally {
        this.buscando.set(false);
      }
    }, 300);
  }

  protected seleccionarCliente(c: ClienteListItem): void {
    this.clienteSeleccionado.set(c);
    this.busquedaCliente.set(`${c.nombre} — ${c.documento}`);
    this.form.get('clienteId')?.setValue(c.id);
    this.mostrarDropdown.set(false);
  }

  protected limpiarCliente(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
    this.form.get('clienteId')?.setValue('');
    this.clientesFiltrados.set([]);
  }

  protected onInputBlur(): void {
    setTimeout(() => {
      this.inputFocused.set(false);
      this.mostrarDropdown.set(false);
    }, 150);
  }

  private nuevaLinea() {
    return this.fb.group({
      productoId: ['', Validators.required],
      cantidad:   [1, [Validators.required, Validators.min(1)]],
    });
  }

  agregarLinea(): void { this.lineas.push(this.nuevaLinea()); }

  quitarLinea(i: number): void {
    if (this.lineas.length > 1) this.lineas.removeAt(i);
  }

  productoDeLinea(i: number): CfProducto | undefined {
    const id = this.lineas.at(i).get('productoId')?.value;
    return this.productos().find(p => p.id === id);
  }

  subtotalLinea(i: number): number {
    const p = this.productoDeLinea(i);
    const qty = Number(this.lineas.at(i).get('cantidad')?.value ?? 0);
    return p ? Number(p.valorVenta) * qty : 0;
  }

  totalVenta(): number {
    return Array.from({ length: this.lineas.length }, (_, i) => this.subtotalLinea(i))
      .reduce((a, b) => a + b, 0);
  }

  async simular(): Promise<void> {
    const total = this.totalVenta();
    if (total <= 0) return;
    const plan = this.form.get('planCuotas')?.value;
    if (!plan?.nCuotas || !plan.fechaInicio || !plan.intervalo) return;
    this.simulando.set(true);
    await this.store.simularCuotas(
      String(total), Number(plan.nCuotas), plan.fechaInicio, plan.intervalo as IntervaloVenta,
    );
    this.simulando.set(false);
  }

  protected campo(path: string): boolean {
    const c = this.form.get(path);
    return !!(c?.invalid && c.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    try {
      const ventaId = await this.store.crear({
        clienteId: v.clienteId!,
        tipo:      v.tipo as 'contado' | 'cuotas' | 'abono',
        reservaId: v.reservaId || undefined,
        notas:     v.notas || undefined,
        lineas: this.lineas.controls.map((_, i) => ({
          productoId: this.lineas.at(i).get('productoId')!.value as string,
          cantidad:   Number(this.lineas.at(i).get('cantidad')!.value),
        })),
        planCuotas: v.tipo === 'cuotas' ? {
          nCuotas:    Number(v.planCuotas?.nCuotas),
          fechaInicio: v.planCuotas?.fechaInicio ?? '',
          intervalo:  v.planCuotas?.intervalo as IntervaloVenta,
        } : undefined,
      });
      this.store.limpiarSimulacion();
      await this.router.navigate(['/credifass/ventas', ventaId]);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Error al registrar la venta.');
    } finally {
      this.guardando.set(false);
    }
  }
}
