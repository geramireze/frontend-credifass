import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { ExportacionStore } from '../data-access/exportacion.store';
import { ReportesStore } from '../../reportes/data-access/reportes.store';
import { REPORTES_META, TipoReporte } from '../../reportes/data-access/reportes.model';

@Component({
  selector: 'app-feature-exportacion',
  imports: [
    ReactiveFormsModule,
    AppIconComponent,
  ],
  templateUrl: './feature-exportacion.html',
  styleUrl: './feature-exportacion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureExportacion implements OnInit, OnDestroy {
  protected readonly store = inject(ExportacionStore);
  protected readonly reportesStore = inject(ReportesStore);
  private readonly fb = inject(FormBuilder);

  protected readonly reportesMeta = REPORTES_META;
  protected readonly selectedFormat = signal<'excel' | 'pdf'>('excel');
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly form = this.fb.nonNullable.group({
    reporte: ['' as TipoReporte | '', Validators.required],
    from: [''],
    to: [''],
  });

  ngOnInit(): void {
    const reporteActivo = this.reportesStore.reporteActivo();
    if (reporteActivo) {
      this.form.patchValue({ reporte: reporteActivo });
    }
    this.store.limpiar();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  protected async exportar(): Promise<void> {
    if (this.form.invalid) return;
    const { reporte, from, to } = this.form.getRawValue();
    if (!reporte) return;

    const filtros = this.reportesStore.reporteActivo() === reporte
      ? this.reportesStore.filtros()
      : { from: from || undefined, to: to || undefined };

    const dto = { reporte, filtros };
    const formato = this.selectedFormat();

    if (formato === 'excel') {
      await this.store.exportarExcel(dto);
    } else {
      await this.store.exportarPdf(dto);
    }

    if (this.store.jobId()) {
      this.iniciarPolling();
    }
  }

  private iniciarPolling(): void {
    this.detenerPolling();
    this.pollingTimer = setInterval(async () => {
      await this.store.consultarJob();
      if (!this.store.jobId()) {
        this.detenerPolling();
      }
    }, 3000);
  }

  private detenerPolling(): void {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}
