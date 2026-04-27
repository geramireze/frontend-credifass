import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { DatePipe, JsonPipe, SlicePipe } from '@angular/common';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { AuditoriaStore } from '../data-access/auditoria.store';
import { AuditoriaItem } from '../data-access/auditoria.model';

@Component({
  selector: 'app-feature-auditoria',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    JsonPipe,
    SlicePipe,
    AppIconComponent,
  ],
  templateUrl: './feature-auditoria.html',
  styleUrl: './feature-auditoria.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureAuditoria implements OnInit {
  protected readonly store = inject(AuditoriaStore);
  private readonly fb = inject(FormBuilder);

  protected readonly itemExpandido = signal<AuditoriaItem | null>(null);

  protected readonly filtroForm = this.fb.nonNullable.group({
    accion: [''],
    entidad: [''],
    from: [''],
    to: [''],
  });

  protected readonly acciones = [
    'LOGIN', 'LOGOUT', 'CREATE_CLIENTE', 'UPDATE_CLIENTE',
    'CREATE_PRESTAMO', 'REGISTRAR_PAGO', 'ANULAR_PAGO',
    'CREATE_USUARIO', 'UPDATE_USUARIO', 'DEACTIVATE_USUARIO',
    'RESET_PASSWORD',
  ];

  protected readonly entidades = [
    'auth', 'clientes', 'prestamos', 'pagos', 'usuarios',
  ];

  ngOnInit(): void {
    this.store.cargar();
  }

  protected buscar(): void {
    const { accion, entidad, from, to } = this.filtroForm.getRawValue();
    this.store.cargar({
      accion: accion || undefined,
      entidad: entidad || undefined,
      from: from || undefined,
      to: to || undefined,
      page: 1,
    });
  }

  protected limpiar(): void {
    this.filtroForm.reset();
    this.store.cargar({ page: 1 });
  }

  protected paginarNext(): void {
    const next = this.store.page() + 1;
    const total = Math.ceil(this.store.total() / this.store.pageSize());
    if (next <= total) this.store.cambiarPagina(next);
  }

  protected paginarPrev(): void {
    const prev = this.store.page() - 1;
    if (prev >= 1) this.store.cambiarPagina(prev);
  }

  protected toggleDetalle(item: AuditoriaItem): void {
    this.itemExpandido.set(this.itemExpandido()?.id === item.id ? null : item);
  }

  protected totalPages(): number {
    return Math.ceil(this.store.total() / this.store.pageSize());
  }

  protected rangeStart(): number {
    return (this.store.page() - 1) * this.store.pageSize() + 1;
  }

  protected rangeEnd(): number {
    return Math.min(this.store.page() * this.store.pageSize(), this.store.total());
  }

  protected accionBadge(accion: string): string {
    if (accion.startsWith('CREATE')) return 'badge badge-success';
    if (accion.startsWith('ANULAR') || accion.startsWith('DELETE') || accion.startsWith('DEACTIVATE')) return 'badge badge-mora';
    if (accion.startsWith('UPDATE') || accion.startsWith('RESET')) return 'badge badge-pendiente';
    return 'badge badge-info';
  }
}
