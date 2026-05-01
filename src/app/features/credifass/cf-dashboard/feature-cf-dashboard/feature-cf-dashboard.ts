import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CopPipe } from '../../../../shared/pipes/cop-pipe';
import { CfDashboardStore } from '../data-access/cf-dashboard.store';

@Component({
  selector: 'app-feature-cf-dashboard',
  imports: [CopPipe, DatePipe],
  templateUrl: './feature-cf-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCfDashboard implements OnInit, OnDestroy {
  protected readonly store = inject(CfDashboardStore);
  private intervalo: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.store.cargar();
    // RN-D04: auto-refresh cada 2 minutos
    this.intervalo = setInterval(() => this.store.cargar(), 120_000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
  }
}
