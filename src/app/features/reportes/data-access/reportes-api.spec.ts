import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportesApiService } from './reportes-api';
import { ReporteResponse } from './reportes.model';

const BASE = 'http://localhost:3000/v1';
const mockResponse: ReporteResponse = { filtros_aplicados: {}, total: 0, page: 1, pageSize: 20, items: [] };

describe('ReportesApiService', () => {
  let service: ReportesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('CA-01: obtener() GET al endpoint correcto para clientes-mora', async () => {
    const promise = service.obtener('clientes-mora');
    const req = httpMock.expectOne(`${BASE}/reportes/clientes-mora`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
    await promise;
  });

  it('CA-02: obtener() GET al endpoint correcto para ganancias', async () => {
    const promise = service.obtener('ganancias', { from: '2024-01-01' });
    const req = httpMock.expectOne((r) => r.url === `${BASE}/reportes/ganancias`);
    expect(req.request.params.get('from')).toBe('2024-01-01');
    req.flush(mockResponse);
    await promise;
  });

  it('CA-03: obtener() omite filtros vacíos', async () => {
    const promise = service.obtener('prestamos-activos', { q: '' });
    const req = httpMock.expectOne(`${BASE}/reportes/prestamos-activos`);
    expect(req.request.params.has('q')).toBe(false);
    req.flush(mockResponse);
    await promise;
  });
});
