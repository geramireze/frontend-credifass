import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { DashboardCfResult } from './cf-dashboard.model';

@Injectable({ providedIn: 'root' })
export class CfDashboardApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cf/dashboard`;

  obtener(): Promise<DashboardCfResult> {
    return firstValueFrom(this.http.get<DashboardCfResult>(this.base));
  }
}
