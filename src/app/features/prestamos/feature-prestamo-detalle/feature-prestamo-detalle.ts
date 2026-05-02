import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PrestamosStore } from '../data-access/prestamos.store';
import { PrestamosApiService } from '../data-access/prestamos-api';
import { AuthStore } from '../../auth/data-access/auth.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { EstadoPrestamo, CuotaPrestamo, PrestamoListItem, FrecuenciaPago } from '../data-access/prestamos.model';
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
  protected readonly frecuenciaEdicion = signal<FrecuenciaPago>('semanal');
  protected readonly esDataLegacy = signal(false);

  protected readonly cuotasPagadas = computed(() =>
    this.store.cuotas().filter(c => c.estado === 'pagada').length,
  );

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
    fecha_inicio:    [''],
    frecuencia_pago: ['semanal' as FrecuenciaPago],
    cobrador_id:     [''],
    mora_activa:     [false],
    ajustar_defecto: [false],
    observaciones:   [''],
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
    const frecuencia = p.frecuencia_pago ?? 'semanal';
    this.formEditar.reset({
      fecha_inicio:    fechaActual,
      frecuencia_pago: frecuencia,
      cobrador_id:     p.cobrador_id ?? '',
      mora_activa:     false,
      ajustar_defecto: false,
      observaciones:   '',
    });
    this.frecuenciaEdicion.set(frecuencia);
    this.esDataLegacy.set(p.monto_total === 0 || p.cuota_semanal === 0);
    this.previewEdicion.set(null);
    this.errorEdicion.set(null);

    const frecCtrl = this.formEditar.get('frecuencia_pago');
    if (this.cuotasPagadas() > 0) {
      frecCtrl?.disable();
    } else {
      frecCtrl?.enable();
    }

    this.mostrarPanelEditar.set(true);
    this.actualizarPreviewFechas(fechaActual, frecuencia, this.cuotasPorFrecuencia(frecuencia));
  }

  private async actualizarPreviewFechas(
    fecha: string,
    frecuencia: FrecuenciaPago,
    numSemanas: number,
  ): Promise<void> {
    if (!fecha) return;
    const p = this.store.seleccionado();
    if (!p) return;
    try {
      const sim = await this.api.simular({
        montoPrestado:  p.monto_prestado || 1,
        tasaSemanal:    0,
        numeroSemanas:  numSemanas || 6,
        modoInteres:    'simple',
        fechaInicio:    fecha,
        frecuenciaPago: frecuencia,
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

  private cuotasPorFrecuencia(f: FrecuenciaPago): number {
    return f === 'quincenal' ? 3 : 6;
  }

  protected onFechaInicioChange(event: Event): void {
    const fecha = (event.target as HTMLInputElement).value;
    if (fecha) this.actualizarPreviewFechas(fecha, this.frecuenciaEdicion(), this.cuotasPorFrecuencia(this.frecuenciaEdicion()));
  }

  protected onFrecuenciaPagoChange(valor: FrecuenciaPago): void {
    this.frecuenciaEdicion.set(valor);
    const fecha = this.formEditar.get('fecha_inicio')?.value ?? '';
    if (fecha) this.actualizarPreviewFechas(fecha, valor, this.cuotasPorFrecuencia(valor));
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
    const dto: {
      fechaInicio?: string;
      frecuenciaPago?: FrecuenciaPago;
      cobradorId?: string;
      moraActiva?: boolean;
      ajustarDefecto?: boolean;
      observaciones?: string;
    } = {};
    const nuevaFecha = v.fecha_inicio?.trim();
    if (nuevaFecha && nuevaFecha !== original?.fecha_inicio?.split('T')[0]) dto.fechaInicio = nuevaFecha;

    // Solo incluir frecuenciaPago si realmente cambió y no hay cuotas pagadas
    const frecuenciaOriginal = (original?.frecuencia_pago ?? 'semanal') as FrecuenciaPago;
    const nuevaFrecuencia = v.frecuencia_pago as FrecuenciaPago;
    const tienePagadas = this.cuotasPagadas() > 0;
    if (nuevaFrecuencia && nuevaFrecuencia !== frecuenciaOriginal && !tienePagadas) {
      dto.frecuenciaPago = nuevaFrecuencia;
    }

    if (v.cobrador_id !== null) dto.cobradorId = v.cobrador_id || undefined;
    if (v.mora_activa !== null) dto.moraActiva = v.mora_activa ?? undefined;
    if (v.ajustar_defecto) dto.ajustarDefecto = true;
    if (v.observaciones) dto.observaciones = v.observaciones;

    const ERRORES: Record<string, string> = {
      PRESTAMO_YA_CERRADO:         'Este préstamo ya fue pagado o cancelado.',
      SIN_PERMISO_EDITAR_PRESTAMO: 'No tienes permiso para editar préstamos.',
      CUOTAS_PAGADAS_NO_AJUSTABLE: 'No se puede cambiar la modalidad cuando ya hay cuotas pagadas.',
      COBRADOR_INVALIDO:           'El cobrador seleccionado no existe o no está activo.',
      FECHA_INICIO_PASADA:         'No tienes permiso para usar una fecha anterior a hoy.',
      FECHA_INICIO_DEMASIADO_FUTURA: 'La fecha no puede superar 30 días en el futuro.',
    };

    try {
      await this.store.editar(id, dto);
      this.cerrarEditar();
    } catch (err: unknown) {
      const body = (err as { error?: { code?: string; message?: string | string[] } })?.error;
      const code = body?.code;
      const rawMsg = Array.isArray(body?.message) ? body!.message[0] : body?.message;
      this.errorEdicion.set(
        (code ? ERRORES[code] : undefined) ?? rawMsg ?? 'No se pudo guardar los cambios.',
      );
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
