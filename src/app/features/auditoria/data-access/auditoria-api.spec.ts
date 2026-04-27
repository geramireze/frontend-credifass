import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuditoriaApiService } from './auditoria-api';
import { AuditoriaResponse } from './auditoria.model';

const BASE = 'http://localhost:3000/v1/auditoria';
const mockResponse: AuditoriaResponse = {
  total: 1, page: 1, pageSize: 20,
  items: [{ id: 'a1', accion: 'LOGIN', entidad: 'auth', entidad_id: null, usuario_id: 'u1', usuario_nombre: 'Admin', ip: '127.0.0.1', request_id: null, payload_nuevo: null, payload_anterior: null, created_at: '2024-01-01T00:00:00Z' }],
};

describe('AuditoriaApiService', () => {
  let service: AuditoriaApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditoriaApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('CA-01: listar() GET /auditoria sin filtros', async () => {
    const promise = service.listar();
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
    const result = await promise;
    expect(result.items).toHaveLength(1);
  });

  it('CA-02: listar() incluye parámetros de filtro en la URL', async () => {
    const promise = service.listar({ accion: 'LOGIN', entidad: 'auth', page: 2 });
    const req = httpMock.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('accion')).toBe('LOGIN');
    expect(req.request.params.get('entidad')).toBe('auth');
    expect(req.request.params.get('page')).toBe('2');
    req.flush(mockResponse);
    await promise;
  });

  it('CA-03: listar() omite filtros undefined o vacíos', async () => {
    const promise = service.listar({ accion: undefined, entidad: '' });
    const req = httpMock.expectOne(BASE);
    expect(req.request.params.has('accion')).toBe(false);
    expect(req.request.params.has('entidad')).toBe(false);
    req.flush(mockResponse);
    await promise;
  });
});
