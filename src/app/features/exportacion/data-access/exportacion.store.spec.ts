import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { ExportacionStore } from './exportacion.store';
import { ExportacionApiService } from './exportacion-api';
import { ExportarDto } from './exportacion.model';

const mockDto: ExportarDto = { reporte: 'clientes-mora' };

describe('ExportacionStore', () => {
  const exportarExcel = vi.fn();
  const exportarPdf = vi.fn();
  const consultarJob = vi.fn();

  let store: InstanceType<typeof ExportacionStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: ExportacionApiService,
          useValue: { exportarExcel, exportarPdf, consultarJob },
        },
      ],
    });
    store = TestBed.inject(ExportacionStore);
  });

  it('CA-01: estado inicial limpio', () => {
    expect(store.loading()).toBe(false);
    expect(store.jobId()).toBeNull();
    expect(store.jobStatus()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('CA-02: exportarExcel() sincrono descarga blob y no guarda jobId', async () => {
    const blob = new Blob(['content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    exportarExcel.mockResolvedValue({ tipo: 'sincrono', blob, fileName: 'reporte.xlsx' });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    await TestBed.runInInjectionContext(() => store.exportarExcel(mockDto));

    expect(store.jobId()).toBeNull();
    expect(store.loading()).toBe(false);
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('CA-03: exportarExcel() asíncrono guarda jobId', async () => {
    exportarExcel.mockResolvedValue({ tipo: 'asincrono', jobId: 'job-123' });

    await TestBed.runInInjectionContext(() => store.exportarExcel(mockDto));

    expect(store.jobId()).toBe('job-123');
    expect(store.loading()).toBe(false);
  });

  it('CA-04: exportarExcel() guarda error cuando la API falla', async () => {
    exportarExcel.mockRejectedValue(new Error('timeout'));

    await TestBed.runInInjectionContext(() => store.exportarExcel(mockDto));

    expect(store.error()).toBe('No se pudo exportar a Excel.');
    expect(store.loading()).toBe(false);
  });

  it('CA-05: exportarPdf() asíncrono guarda jobId', async () => {
    exportarPdf.mockResolvedValue({ tipo: 'asincrono', jobId: 'job-pdf-1' });

    await TestBed.runInInjectionContext(() => store.exportarPdf(mockDto));

    expect(store.jobId()).toBe('job-pdf-1');
  });

  it('CA-06: exportarPdf() guarda error cuando la API falla', async () => {
    exportarPdf.mockRejectedValue(new Error('error'));

    await TestBed.runInInjectionContext(() => store.exportarPdf(mockDto));

    expect(store.error()).toBe('No se pudo exportar a PDF.');
  });

  it('CA-07: consultarJob() cuando no hay jobId no llama a la API', async () => {
    await TestBed.runInInjectionContext(() => store.consultarJob());
    expect(consultarJob).not.toHaveBeenCalled();
  });

  it('CA-08: consultarJob() status "done" limpia jobId y abre URL', async () => {
    exportarExcel.mockResolvedValue({ tipo: 'asincrono', jobId: 'job-1' });
    await TestBed.runInInjectionContext(() => store.exportarExcel(mockDto));

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    consultarJob.mockResolvedValue({
      job_id: 'job-1',
      status: 'done',
      url_descarga: 'https://cdn.example.com/reporte.xlsx',
    });

    await TestBed.runInInjectionContext(() => store.consultarJob());

    expect(openSpy).toHaveBeenCalledWith('https://cdn.example.com/reporte.xlsx', '_blank');
    expect(store.jobId()).toBeNull();
    openSpy.mockRestore();
  });

  it('CA-09: consultarJob() status "error" conserva jobId y guarda jobStatus', async () => {
    exportarExcel.mockResolvedValue({ tipo: 'asincrono', jobId: 'job-err' });
    await TestBed.runInInjectionContext(() => store.exportarExcel(mockDto));

    consultarJob.mockResolvedValue({
      job_id: 'job-err',
      status: 'error',
      url_descarga: null,
      mensaje: 'Timeout',
    });

    await TestBed.runInInjectionContext(() => store.consultarJob());

    expect(store.jobStatus()?.status).toBe('error');
    expect(store.jobId()).toBe('job-err');
  });

  it('CA-10: consultarJob() guarda error cuando la API falla', async () => {
    exportarExcel.mockResolvedValue({ tipo: 'asincrono', jobId: 'job-x' });
    await TestBed.runInInjectionContext(() => store.exportarExcel(mockDto));

    consultarJob.mockRejectedValue(new Error('network'));
    await TestBed.runInInjectionContext(() => store.consultarJob());

    expect(store.error()).toBe('Error al consultar el estado del trabajo.');
  });

  it('CA-11: limpiarError() limpia el error', async () => {
    exportarExcel.mockRejectedValue(new Error());
    await TestBed.runInInjectionContext(() => store.exportarExcel(mockDto));
    expect(store.error()).not.toBeNull();

    TestBed.runInInjectionContext(() => store.limpiarError());
    expect(store.error()).toBeNull();
  });

  it('CA-12: limpiar() resetea todo el estado', async () => {
    exportarExcel.mockResolvedValue({ tipo: 'asincrono', jobId: 'job-x' });
    await TestBed.runInInjectionContext(() => store.exportarExcel(mockDto));
    expect(store.jobId()).toBe('job-x');

    TestBed.runInInjectionContext(() => store.limpiar());
    expect(store.jobId()).toBeNull();
    expect(store.loading()).toBe(false);
  });
});
