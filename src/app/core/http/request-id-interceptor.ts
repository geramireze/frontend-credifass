import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AppLoggerService } from '../logging/app-logger';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(AppLoggerService);
  const requestId = uuid();
  const start = Date.now();

  const cloned = req.clone({ setHeaders: { 'X-Request-Id': requestId } });

  return next(cloned).pipe(
    tap({
      next: () => {
        logger.debug('http_response', { requestId, url: req.url, latencia_ms: Date.now() - start });
      },
      error: (err) => {
        logger.error('http_error', { requestId, url: req.url, status: err.status, latencia_ms: Date.now() - start });
      },
    }),
  );
};
