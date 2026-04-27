import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { vi } from 'vitest';
import { authInterceptor } from './auth-interceptor';
import { AuthApiService } from '../../features/auth/data-access/auth-api';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const refreshMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', component: class {} }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthApiService, useValue: { refresh: refreshMock } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    sessionStorage.clear();
    httpMock.verify();
  });

  it('CA-01: agrega Authorization header cuando hay access_token', async () => {
    sessionStorage.setItem('access_token', 'my-token');
    const promise = firstValueFrom(http.get('/api/data'));
    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({ ok: true });
    await promise;
  });

  it('CA-02: no agrega Authorization header cuando no hay access_token', async () => {
    const promise = firstValueFrom(http.get('/api/data'));
    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });
    await promise;
  });

  it('CA-03: pasa errores no-401 directamente', async () => {
    const promise = firstValueFrom(http.get('/api/data'));
    httpMock.expectOne('/api/data').flush(
      { message: 'forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );
    await expect(promise).rejects.toBeDefined();
  });

  it('CA-04: pasa errores 401 en rutas /auth/ directamente', async () => {
    const promise = firstValueFrom(http.post('/api/auth/login', {}));
    httpMock.expectOne('/api/auth/login').flush(
      { message: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await expect(promise).rejects.toBeDefined();
  });

  it('CA-05: error 401 fuera de rutas /auth/ rechaza el observable', async () => {
    sessionStorage.setItem('access_token', 'expired-token');

    const promise = firstValueFrom(http.get('/api/secure'));
    httpMock.expectOne('/api/secure').flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );
    // The promise should reject (either via sessionStorage.clear path or re-throw)
    await expect(promise).rejects.toBeDefined();
  });

  it('CA-06: errores 500 se propagan sin intentar refresh', async () => {
    sessionStorage.setItem('access_token', 'tok');
    sessionStorage.setItem('refresh_token', 'ref');

    const promise = firstValueFrom(http.get('/api/data'));
    httpMock.expectOne('/api/data').flush(
      { message: 'Server Error' },
      { status: 500, statusText: 'Server Error' },
    );
    await expect(promise).rejects.toBeDefined();
    // Refresh mock should NOT have been called for non-401 errors
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
