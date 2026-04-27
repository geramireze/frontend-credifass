import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuariosApiService } from './usuarios-api';
import { UsuarioListItem } from './usuarios.model';

const BASE = 'http://localhost:3000/v1/usuarios';
const mockUser: UsuarioListItem = { id: 'u1', nombre: 'Admin', email: 'admin@test.com', rol: 'admin', activo: true, created_at: '2024-01-01T00:00:00Z' };

describe('UsuariosApiService', () => {
  let service: UsuariosApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuariosApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('CA-01: listar() GET /usuarios', async () => {
    const promise = service.listar();
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockUser], total: 1 });
    const result = await promise;
    expect(result.items[0].email).toBe('admin@test.com');
  });

  it('CA-02: crear() POST /usuarios con DTO', async () => {
    const dto = { nombre: 'Admin', email: 'admin@test.com', rolCodigo: 'admin' as const };
    const promise = service.crear(dto);
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ ...mockUser, password_temporal: 'Tmp123!' });
    const result = await promise;
    expect(result.password_temporal).toBe('Tmp123!');
  });

  it('CA-03: editar() PATCH /usuarios/:id', async () => {
    const promise = service.editar('u1', { nombre: 'Admin Editado' });
    const req = httpMock.expectOne(`${BASE}/u1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockUser, nombre: 'Admin Editado' });
    const result = await promise;
    expect(result.nombre).toBe('Admin Editado');
  });

  it('CA-04: desactivar() POST /usuarios/:id/desactivar', async () => {
    const promise = service.desactivar('u1');
    const req = httpMock.expectOne(`${BASE}/u1/desactivar`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
    await promise;
  });

  it('CA-05: reactivar() POST /usuarios/:id/reactivar', async () => {
    const promise = service.reactivar('u1');
    const req = httpMock.expectOne(`${BASE}/u1/reactivar`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
    await promise;
  });

  it('CA-06: resetPassword() POST /usuarios/:id/reset-password', async () => {
    const promise = service.resetPassword('u1');
    const req = httpMock.expectOne(`${BASE}/u1/reset-password`);
    expect(req.request.method).toBe('POST');
    req.flush({ password_temporal: 'NewPass99!' });
    const result = await promise;
    expect(result.password_temporal).toBe('NewPass99!');
  });
});
