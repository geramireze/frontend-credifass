import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { CierresStore } from '../data-access/cierres.store';
import { AuthStore } from '../../auth/data-access/auth.store';
import { PdfService } from '../../../shared/services/pdf';
import type { CierreSemana } from '../data-access/cierres.model';

@Component({
  selector: 'app-feature-cierres',
  imports: [DatePipe, CopPipe, AppIconComponent],
  templateUrl: './feature-cierres.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCierres implements OnInit {
  protected readonly store     = inject(CierresStore);
  protected readonly authStore = inject(AuthStore);
  private  readonly pdfSvc    = inject(PdfService);

  protected readonly exportando = signal(false);

  ngOnInit(): void {
    this.store.cargar();
  }

  protected verDetalle(c: CierreSemana): void {
    this.store.seleccionar(c);
  }

  protected async exportarPdf(): Promise<void> {
    const c = this.store.seleccionado();
    if (!c || this.exportando()) return;
    this.exportando.set(true);
    await this.pdfSvc.exportarCierre(c);
    this.exportando.set(false);
  }

  protected esAdmin(): boolean {
    return this.authStore.rol() === 'admin';
  }
}
