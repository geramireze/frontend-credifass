import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExportarDto, ExportacionResult, JobStatus } from './exportacion.model';

@Injectable({
  providedIn: 'root',
})
export class ExportacionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/export`;

  async exportarExcel(dto: ExportarDto): Promise<ExportacionResult> {
    const res = await firstValueFrom(
      this.http.post(this.base + '/excel', dto, { observe: 'response', responseType: 'blob' }),
    );
    if (res.status === 202) {
      const body = JSON.parse(await (res.body as Blob).text()) as { job_id: string };
      return { tipo: 'asincrono', jobId: body.job_id };
    }
    const cd = res.headers.get('Content-Disposition') ?? '';
    const fileName = cd.match(/filename="?([^";]+)"?/)?.[1] ?? `reporte_${dto.reporte}.xlsx`;
    return { tipo: 'sincrono', blob: res.body as Blob, fileName };
  }

  async exportarPdf(dto: ExportarDto): Promise<ExportacionResult> {
    const res = await firstValueFrom(
      this.http.post(this.base + '/pdf', dto, { observe: 'response', responseType: 'blob' }),
    );
    if (res.status === 202) {
      const body = JSON.parse(await (res.body as Blob).text()) as { job_id: string };
      return { tipo: 'asincrono', jobId: body.job_id };
    }
    const cd = res.headers.get('Content-Disposition') ?? '';
    const fileName = cd.match(/filename="?([^";]+)"?/)?.[1] ?? `reporte_${dto.reporte}.pdf`;
    return { tipo: 'sincrono', blob: res.body as Blob, fileName };
  }

  consultarJob(jobId: string): Promise<JobStatus> {
    return firstValueFrom(this.http.get<JobStatus>(`${this.base}/jobs/${jobId}`));
  }
}
