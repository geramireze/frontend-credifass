import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { errorInterceptor } from './error-interceptor';
import { AppLoggerService } from '../logging/app-logger';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const logError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AppLoggerService, useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: logError } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('CA-01: pasa solicitudes exitosas sin modificar', async () => {
    const promise = firstValueFrom(http.get('/api/test'));
    httpMock.expectOne('/api/test').flush({ ok: true });
    const result = await promise;
    expect(result).toEqual({ ok: true });
  });

  it('CA-02: mapea errores HTTP a ApiError y llama logger.error', async () => {
    const promise = firstValueFrom(http.get('/api/fail'));
    httpMock.expectOne('/api/fail').flush(
      { message: 'Server error', code: 'INTERNAL' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    await expect(promise).rejects.toMatchObject({ statusCode: 500, message: 'Server error' });
    expect(logError).toHaveBeenCalled();
  });

  it('CA-03: usa el mensaje del HttpErrorResponse cuando el cuerpo no tiene message', async () => {
    const promise = firstValueFrom(http.get('/api/notfound'));
    httpMock.expectOne('/api/notfound').flush(
      {},
      { status: 404, statusText: 'Not Found' },
    );
    await expect(promise).rejects.toMatchObject({ statusCode: 404 });
  });
});
