import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { AppIconComponent } from '../../../../shared/components/icon/icon';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfReservasStore } from '../data-access/cf-reservas.store';
import { ClientesApiService } from '../../../clientes/data-access/clientes-api';
import { CfProductosApi } from '../../cf-productos/data-access/cf-productos-api';
import type { ClienteListItem } from '../../../clientes/data-access/clientes.model';
import type { CfProducto } from '../../cf-productos/data-access/cf-productos.model';
import type { TipoOrigenReserva } from '../data-access/cf-reservas.model';

@Component({
  selector: 'app-feature-cf-reserva-form',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent, CopPipe, TitleCasePipe],
  templateUrl: './feature-cf-reserva-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfReservaForm implements OnInit {
  protected readonly store      = inject(CfReservasStore);
  private readonly router       = inject(Router);
  private readonly fb           = inject(FormBuilder);
  private readonly clientesApi  = inject(ClientesApiService);
  private readonly productosApi = inject(CfProductosApi);

  protected readonly guardando  = signal(false);
  protected readonly error      = signal<string | null>(null);
  protected readonly productos  = signal<CfProducto[]>([]);

  // Buscador de clientes
  protected readonly busquedaCliente    = signal('');
  protected readonly clientesFiltrados  = signal<ClienteListItem[]>([]);
  protected readonly clienteSeleccionado = signal<ClienteListItem | null>(null);
  protected readonly buscando           = signal(false);
  protected readonly mostrarDropdown    = signal(false);
  protected readonly inputFocused       = signal(false);

  protected readonly mediosPago = ['efectivo', 'transferencia', 'nequi', 'daviplata', 'otro'];
  protected readonly origenes: { value: TipoOrigenReserva; label: string }[] = [
    { value: 'en_inventario', label: 'En inventario (aparta producto existente)' },
    { value: 'por_encargo',   label: 'Por encargo (se pedirá al proveedor)' },
  ];

  protected readonly form = this.fb.group({
    clienteId:            ['', Validators.required],
    productoId:           ['', Validators.required],
    cantidad:             [1, [Validators.required, Validators.min(1)]],
    precioAcordado:       ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    tipoOrigen:           ['en_inventario' as TipoOrigenReserva, Validators.required],
    abonoInicial:         ['0'],
    medioPagoAbono:       ['efectivo'],
    fechaEntregaEstimada: [''],
    notas:                [''],
  });

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    const productos = await this.productosApi.listar({ pageSize: 200 }).then(r => r.items).catch(() => []);
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

  protected productoSeleccionado(): CfProducto | undefined {
    const id = this.form.get('productoId')?.value;
    return this.productos().find(p => p.id === id);
  }

  protected campo(name: string): boolean {
    const c = this.form.get(name);
    return !!(c?.invalid && c.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    const abono = Number(v.abonoInicial ?? 0);

    try {
      await this.store.crear({
        clienteId:            v.clienteId!,
        productoId:           v.productoId!,
        cantidad:             Number(v.cantidad),
        precioAcordado:       String(v.precioAcordado ?? '0'),
        tipoOrigen:           v.tipoOrigen as TipoOrigenReserva,
        abonoInicial:         abono > 0 ? String(abono) : undefined,
        medioPagoAbono:       abono > 0 ? (v.medioPagoAbono ?? 'efectivo') : undefined,
        fechaEntregaEstimada: v.fechaEntregaEstimada || undefined,
        notas:                v.notas || undefined,
      });
      await this.router.navigate(['/credifass/reservas']);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Error al crear la reserva.');
    } finally {
      this.guardando.set(false);
    }
  }
}
