import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { ReportesStore } from '../data-access/reportes.store';
import { ExportacionStore } from '../../exportacion/data-access/exportacion.store';
import {
  REPORTES_META,
  ReporteMeta,
  TipoReporte,
} from '../data-access/reportes.model';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-feature-reportes',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CopPipe,
    KeyValuePipe,
    AppIconComponent,
  ],
  templateUrl: './feature-reportes.html',
  styleUrl: './feature-reportes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureReportes implements OnInit {
  protected readonly store = inject(ReportesStore);
  protected readonly exportStore = inject(ExportacionStore);
  private readonly fb = inject(FormBuilder);

  protected readonly reportesMeta = REPORTES_META;

  protected readonly metaActiva = computed<ReporteMeta | null>(() => {
    const tipo = this.store.reporteActivo();
    return tipo ? (REPORTES_META.find((m) => m.id === tipo) ?? null) : null;
  });

  protected readonly columnaIds = computed<string[]>(() =>
    this.metaActiva()?.columnas.map((c) => c.campo) ?? [],
  );

  protected readonly filtroForm = this.fb.nonNullable.group({
    from: [''],
    to: [''],
    q: [''],
  });

  ngOnInit(): void {
    if (!this.store.reporteActivo()) {
      this.store.seleccionar('prestamos-activos' as TipoReporte);
    }
  }

  protected seleccionarReporte(id: TipoReporte): void {
    this.filtroForm.reset();
    this.store.seleccionar(id);
  }

  protected buscar(): void {
    const { from, to, q } = this.filtroForm.getRawValue();
    this.store.aplicarFiltros({ from: from || undefined, to: to || undefined, q: q || undefined });
  }

  protected paginarNext(): void {
    const datos = this.store.datos();
    if (!datos) return;
    const pageSize = this.store.filtros().pageSize ?? 20;
    const page = this.store.filtros().page ?? 1;
    const total = Math.ceil(datos.total / pageSize);
    if (page < total) this.store.cambiarPagina(page + 1);
  }

  protected paginarPrev(): void {
    const page = this.store.filtros().page ?? 1;
    if (page > 1) this.store.cambiarPagina(page - 1);
  }

  protected currentPage(): number {
    return this.store.filtros().page ?? 1;
  }

  protected totalPages(): number {
    const datos = this.store.datos();
    if (!datos) return 1;
    const pageSize = this.store.filtros().pageSize ?? 20;
    return Math.ceil(datos.total / pageSize);
  }

  private static readonly ESTADO_LABELS: Record<string, string> = {
    al_dia: 'Al día',
    pendiente_por_vencer: 'Por vencer',
    en_mora: 'En mora',
    pagado: 'Pagado',
    cancelado: 'Cancelado',
  };

  protected valorCelda(row: Record<string, unknown>, campo: string, tipo: string): string {
    const val = row[campo];
    if (val === null || val === undefined || val === '') return '—';
    if (tipo === 'fecha') return new Date(val as string).toLocaleDateString('es-CO');
    if (tipo === 'numero') return Number(val).toLocaleString('es-CO');
    if (campo === 'estado') return FeatureReportes.ESTADO_LABELS[val as string] ?? String(val);
    return String(val);
  }

  protected valorNumerico(row: Record<string, unknown>, campo: string): number | null {
    const val = row[campo];
    if (val === null || val === undefined) return null;
    return Number(val);
  }

  protected exportar(formato: 'excel' | 'pdf'): void {
    const tipo = this.store.reporteActivo();
    if (!tipo) return;
    const dto = { reporte: tipo, filtros: this.store.filtros() };
    if (formato === 'excel') {
      this.exportStore.exportarExcel(dto);
    } else {
      this.exportStore.exportarPdf(dto);
    }
  }
}
