import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardResponse, RangoDashboard } from './dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reportes/dashboard`;

  getDashboard(rango: RangoDashboard, from?: string, to?: string): Promise<DashboardResponse> {
    let params = new HttpParams().set('rango', rango);
    if (rango === 'custom' && from && to) {
      params = params.set('from', from).set('to', to);
    }
    return firstValueFrom(this.http.get<DashboardResponse>(this.base, { params }));
  }
}
