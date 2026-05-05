import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { CierreSemana } from './cierres.model';

@Injectable({ providedIn: 'root' })
export class CierresApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cierres`;

  listar(): Promise<CierreSemana[]> {
    return firstValueFrom(this.http.get<CierreSemana[]>(this.base));
  }

  crear(): Promise<CierreSemana> {
    return firstValueFrom(this.http.post<CierreSemana>(this.base, {}));
  }
}
