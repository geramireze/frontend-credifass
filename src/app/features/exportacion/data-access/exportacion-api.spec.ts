import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExportacionApiService } from './exportacion-api';

const BASE = 'http://localhost:3000/v1/export';

describe('ExportacionApiService', () => {
  let service: ExportacionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExportacionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('CA-01: exportarExcel() 200 devuelve resultado síncrono con blob', async () => {
    const dto = { reporte: 'clientes-mora' as const };
    const promise = service.exportarExcel(dto);
    const req = httpMock.expectOne(`${BASE}/excel`);
    expect(req.request.method).toBe('POST');
    req.flush(new Blob(['xlsx-data']), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Disposition': 'attachment; filename="reporte.xlsx"' },
    });
    const result = await promise;
    expect(result.tipo).toBe('sincrono');
    if (result.tipo === 'sincrono') {
      expect(result.fileName).toBe('reporte.xlsx');
    }
  });

  it('CA-02: exportarExcel() usa nombre de fallback si no hay Content-Disposition', async () => {
    const dto = { reporte: 'ganancias' as const };
    const promise = service.exportarExcel(dto);
    const req = httpMock.expectOne(`${BASE}/excel`);
    req.flush(new Blob(['xlsx-data']), { status: 200, statusText: 'OK' });
    const result = await promise;
    expect(result.tipo).toBe('sincrono');
    if (result.tipo === 'sincrono') {
      expect(result.fileName).toBe('reporte_ganancias.xlsx');
    }
  });

  it('CA-03: exportarPdf() 200 devuelve resultado síncrono', async () => {
    const dto = { reporte: 'clientes-mora' as const };
    const promise = service.exportarPdf(dto);
    const req = httpMock.expectOne(`${BASE}/pdf`);
    expect(req.request.method).toBe('POST');
    req.flush(new Blob(['pdf-data']), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Disposition': 'attachment; filename="reporte.pdf"' },
    });
    const result = await promise;
    expect(result.tipo).toBe('sincrono');
  });

  it('CA-04: exportarExcel() 202 devuelve resultado asíncrono con jobId', async () => {
    const dto = { reporte: 'ganancias' as const };
    const promise = service.exportarExcel(dto);
    const req = httpMock.expectOne(`${BASE}/excel`);
    // 202 response — body is a Blob containing JSON
    const jsonBlob = new Blob([JSON.stringify({ job_id: 'job-excel-1' })], { type: 'application/json' });
    req.flush(jsonBlob, { status: 202, statusText: 'Accepted' });
    const result = await promise;
    expect(result.tipo).toBe('asincrono');
    if (result.tipo === 'asincrono') {
      expect(result.jobId).toBe('job-excel-1');
    }
  });

  it('CA-05: exportarPdf() 202 devuelve resultado asíncrono con jobId', async () => {
    const dto = { reporte: 'ganancias' as const };
    const promise = service.exportarPdf(dto);
    const req = httpMock.expectOne(`${BASE}/pdf`);
    const jsonBlob = new Blob([JSON.stringify({ job_id: 'job-pdf-1' })], { type: 'application/json' });
    req.flush(jsonBlob, { status: 202, statusText: 'Accepted' });
    const result = await promise;
    expect(result.tipo).toBe('asincrono');
    if (result.tipo === 'asincrono') {
      expect(result.jobId).toBe('job-pdf-1');
    }
  });

  it('CA-06: consultarJob() GET /export/jobs/:id', async () => {
    const promise = service.consultarJob('job-123');
    const req = httpMock.expectOne(`${BASE}/jobs/job-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ job_id: 'job-123', status: 'done', url_descarga: 'https://cdn.example.com/r.xlsx' });
    const result = await promise;
    expect(result.status).toBe('done');
  });
});
