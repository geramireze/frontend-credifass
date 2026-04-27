import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api';

const BASE = 'http://localhost:3000/v1/auth';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('CA-01: login() POST /auth/login con credenciales', async () => {
    const mockResponse = {
      accessToken: 'acc',
      refreshToken: 'ref',
      user: { id: 'u1', nombre: 'Admin', email: 'admin@test.com', rol: 'admin', permisos: {} },
    };
    const promise = service.login({ email: 'admin@test.com', password: 'pass' });
    const req = httpMock.expectOne(`${BASE}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'pass' });
    req.flush(mockResponse);
    const result = await promise;
    expect(result.accessToken).toBe('acc');
  });

  it('CA-02: logout() POST /auth/logout', async () => {
    const promise = service.logout();
    const req = httpMock.expectOne(`${BASE}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
    await promise;
  });

  it('CA-03: forgotPassword() POST /auth/forgot-password', async () => {
    const promise = service.forgotPassword('admin@test.com');
    const req = httpMock.expectOne(`${BASE}/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@test.com' });
    req.flush({ message: 'Email enviado' });
    const result = await promise;
    expect(result.message).toBe('Email enviado');
  });

  it('CA-04: resetPassword() POST /auth/reset-password', async () => {
    const promise = service.resetPassword('tok-123', 'NewPass99!');
    const req = httpMock.expectOne(`${BASE}/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok-123', password: 'NewPass99!' });
    req.flush(null);
    await promise;
  });

  it('CA-05: refresh() POST /auth/refresh y devuelve Observable de tokens', async () => {
    const promise = firstValueFrom(service.refresh('ref-token-123'));
    const req = httpMock.expectOne(`${BASE}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'ref-token-123' });
    req.flush({ accessToken: 'new-acc', refreshToken: 'new-ref' });
    const result = await promise;
    expect(result.accessToken).toBe('new-acc');
  });
});
