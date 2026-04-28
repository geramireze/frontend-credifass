import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PrestamosStore } from '../data-access/prestamos.store';
import { PrestamosApiService } from '../data-access/prestamos-api';
import { AuthStore } from '../../auth/data-access/auth.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { EstadoPrestamo, CuotaPrestamo, PrestamoListItem } from '../data-access/prestamos.model';
import { UsuariosApiService } from '../../usuarios/data-access/usuarios-api';
import { UsuarioListItem } from '../../usuarios/data-access/usuarios.model';

const ESTADO_LABELS: Record<EstadoPrestamo, string> = {
  al_dia: 'Al día',
  pendiente_por_vencer: 'Por vencer',
  en_mora: 'En mora',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
};

const ESTADO_BADGE: Record<EstadoPrestamo, string> = {
  al_dia: 'badge badge-success',
  pendiente_por_vencer: 'badge badge-pendiente',
  en_mora: 'badge badge-mora',
  pagado: 'badge badge-pagado',
  cancelado: 'badge badge-cancelado',
};

const CUOTA_BADGE: Record<CuotaPrestamo['estado'], string> = {
  pendiente: 'badge badge-info',
  pagada: 'badge badge-success',
  vencida: 'badge badge-mora',
};

const CUOTA_LABELS: Record<CuotaPrestamo['estado'], string> = {
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  vencida: 'Vencida',
};

@Component({
  selector: 'app-feature-prestamo-detalle',
  imports: [RouterLink, CopPipe, AppIconComponent, SlicePipe, ReactiveFormsModule],
  templateUrl: './feature-prestamo-detalle.html',
  styleUrl: './feature-prestamo-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePrestamoDetalle implements OnInit {
  protected readonly store = inject(PrestamosStore);
  private readonly authStore = inject(AuthStore);
  private readonly api = inject(PrestamosApiService);
  private readonly usuariosApi = inject(UsuariosApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly cobradores = signal<UsuarioListItem[]>([]);
  private readonly fb = inject(FormBuilder);

  protected readonly tabActivo = signal<'resumen' | 'cronograma' | 'pagos' | 'auditoria'>('cronograma');
  protected readonly mostrarPanelEditar = signal(false);
  protected readonly guardandoEdicion = signal(false);
  protected readonly errorEdicion = signal<string | null>(null);
  protected readonly previewEdicion = signal<{ primera: string; ultima: string } | null>(null);

  protected readonly puedeEditar = computed(() => {
    const u = this.authStore.usuario();
    if (!u) return false;
    const p = u.permisos ?? {};
    return u.rol === 'admin' || p['*'] === true || p['prestamos.edit'] === true;
  });

  protected readonly puedeFechaPasada = computed(() => {
    const u = this.authStore.usuario();
    if (!u) return false;
    const p = u.permisos ?? {};
    return u.rol === 'admin' || p['*'] === true || p['prestamos.fecha_pasada'] === true;
  });

  protected readonly hoy = new Date().toISOString().split('T')[0];
  protected readonly maxFecha = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  protected readonly fechaMinima = computed(() =>
    this.puedeFechaPasada() ? '' : this.hoy,
  );

  protected readonly formEditar = this.fb.group({
    fecha_inicio:  [''],
    cobrador_id:   [''],
    mora_activa:   [false],
    observaciones: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.store.cargarDetalle(id);
    this.usuariosApi.listar()
      .then((res) => this.cobradores.set(res.items.filter((u) => u.rol === 'cobrador' && u.activo)))
      .catch(() => {});
  }

  protected estadoLabel(e: string): string  { return ESTADO_LABELS[e as EstadoPrestamo] ?? e; }
  protected estadoBadge(e: string): string  { return ESTADO_BADGE[e as EstadoPrestamo] ?? 'badge'; }
  protected cuotaBadge(e: string): string   { return CUOTA_BADGE[e as CuotaPrestamo['estado']] ?? 'badge'; }
  protected cuotaLabel(e: string): string   { return CUOTA_LABELS[e as CuotaPrestamo['estado']] ?? e; }

  protected formatFecha(fecha: string): string {
    const [y, m, d] = fecha.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  protected pctPagado(prestamo: { saldo_pendiente: number; monto_total: number }): number {
    const pagado = prestamo.monto_total - prestamo.saldo_pendiente;
    return Math.max(0, Math.min(100, Math.round((pagado / prestamo.monto_total) * 100)));
  }

  protected abrirEditar(p: PrestamoListItem): void {
    const fechaActual = p.fecha_inicio.split('T')[0];
    this.formEditar.reset({
      fecha_inicio:  fechaActual,
      cobrador_id:   p.cobrador_id ?? '',
      mora_activa:   false,
      observaciones: '',
    });
    this.previewEdicion.set(null);
    this.errorEdicion.set(null);
    this.mostrarPanelEditar.set(true);
    this.actualizarPreviewFechas(fechaActual, p);
  }

  private async actualizarPreviewFechas(fecha: string, p: PrestamoListItem): Promise<void> {
    if (!fecha) return;
    try {
      const sim = await this.api.simular({
        montoPrestado:  p.monto_prestado,
        tasaSemanal:    0,
        numeroSemanas:  p.numero_semanas,
        modoInteres:    'simple',
        fechaInicio:    fecha,
        frecuenciaPago: p.frecuencia_pago,
      });
      const cron = sim.cronograma;
      if (cron?.length) {
        this.previewEdicion.set({
          primera: this.formatFecha(cron[0].fechaEsperada),
          ultima:  this.formatFecha(cron[cron.length - 1].fechaEsperada),
        });
      }
    } catch {
      this.previewEdicion.set(null);
    }
  }

  protected onFechaInicioChange(event: Event): void {
    const fecha = (event.target as HTMLInputElement).value;
    const p = this.store.seleccionado();
    if (p) this.actualizarPreviewFechas(fecha, p);
  }

  protected cerrarEditar(): void {
    this.mostrarPanelEditar.set(false);
    this.errorEdicion.set(null);
  }

  protected async guardarEdicion(id: string): Promise<void> {
    if (this.guardandoEdicion()) return;
    this.guardandoEdicion.set(true);
    this.errorEdicion.set(null);
    const v = this.formEditar.getRawValue();
    const original = this.store.seleccionado();
    const dto: { fechaInicio?: string; cobradorId?: string; moraActiva?: boolean; observaciones?: string } = {};
    const nuevaFecha = v.fecha_inicio?.trim();
    if (nuevaFecha && nuevaFecha !== original?.fecha_inicio?.split('T')[0]) dto.fechaInicio = nuevaFecha;
    if (v.cobrador_id !== null) dto.cobradorId = v.cobrador_id || undefined;
    if (v.mora_activa !== null) dto.moraActiva = v.mora_activa ?? undefined;
    if (v.observaciones) dto.observaciones = v.observaciones;
    try {
      await this.store.editar(id, dto);
      this.cerrarEditar();
    } catch (err: unknown) {
      const body = (err as { error?: { message?: string | string[] } })?.error;
      const msg = Array.isArray(body?.message) ? body!.message[0] : body?.message;
      this.errorEdicion.set(msg ?? 'No se pudo guardar los cambios.');
    } finally {
      this.guardandoEdicion.set(false);
    }
  }

  protected async confirmarCancelar(id: string): Promise<void> {
    if (!confirm('¿Cancelar este préstamo? Esta acción no se puede deshacer.')) return;
    try {
      await this.store.cancelar(id);
      await this.router.navigate(['/prestamos']);
    } catch {
      // error is set in store
    }
  }
}
