import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { DashboardStore } from '../data-access/dashboard.store';
import { AuthStore } from '../../auth/data-access/auth.store';
import { CfDashboardStore } from '../../credifass/cf-dashboard/data-access/cf-dashboard.store';
import { CopPipe } from '../../../shared/pipes/cop-pipe';
import { AppIconComponent } from '../../../shared/components/icon/icon';
import { RangoDashboard } from '../data-access/dashboard.model';

@Component({
  selector: 'app-feature-dashboard',
  imports: [NgxEchartsDirective, CopPipe, AppIconComponent],
  templateUrl: './feature-dashboard.html',
  styleUrl: './feature-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureDashboard implements OnInit {
  protected readonly store    = inject(DashboardStore);
  protected readonly cfStore  = inject(CfDashboardStore);
  protected readonly authStore = inject(AuthStore);

  protected readonly rangos: { value: RangoDashboard; label: string }[] = [
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: '90d', label: '90d' },
    { value: 'mes_actual', label: 'Mes actual' },
    { value: 'anio_actual', label: 'Año actual' },
  ];

  ngOnInit(): void {
    this.store.cargar();
    this.cfStore.cargar();
  }

  protected onRangoChange(rango: RangoDashboard): void {
    this.store.cargar(rango);
  }
}
