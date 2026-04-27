import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { AppLoggerService } from '../logging/app-logger';

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  requestId?: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(AppLoggerService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const apiError: ApiError = {
        message: err.error?.message ?? err.message ?? 'Error desconocido',
        code: err.error?.code,
        statusCode: err.status,
        requestId: err.error?.requestId ?? req.headers.get('X-Request-Id') ?? undefined,
      };
      logger.error('api_error', { ...apiError, url: req.url });
      return throwError(() => apiError);
    }),
  );
};
