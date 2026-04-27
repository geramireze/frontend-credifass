import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { requestIdInterceptor } from './request-id-interceptor';
import { AppLoggerService } from '../logging/app-logger';

describe('requestIdInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const logDebug = vi.fn();
  const logError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([requestIdInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AppLoggerService,
          useValue: { debug: logDebug, info: vi.fn(), warn: vi.fn(), error: logError },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('CA-01: agrega el header X-Request-Id a cada solicitud', async () => {
    const promise = firstValueFrom(http.get('/api/test'));
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('X-Request-Id')).toBe(true);
    expect(req.request.headers.get('X-Request-Id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    req.flush({});
    await promise;
  });

  it('CA-02: llama logger.debug con requestId y latencia en respuestas exitosas', async () => {
    const promise = firstValueFrom(http.get('/api/ok'));
    httpMock.expectOne('/api/ok').flush({ ok: true });
    await promise;
    expect(logDebug).toHaveBeenCalledWith('http_response', expect.objectContaining({
      url: '/api/ok',
      latencia_ms: expect.any(Number),
    }));
  });

  it('CA-03: llama logger.error con requestId en respuestas fallidas', async () => {
    const promise = firstValueFrom(http.get('/api/fail'));
    httpMock.expectOne('/api/fail').flush(
      { message: 'error' },
      { status: 500, statusText: 'Server Error' },
    );
    await expect(promise).rejects.toBeDefined();
    expect(logError).toHaveBeenCalledWith('http_error', expect.objectContaining({
      url: '/api/fail',
      latencia_ms: expect.any(Number),
    }));
  });
});
