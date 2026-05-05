import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { AppLoggerService } from '../logging/app-logger';

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  requestId?: string;
  data?: Record<string, unknown>;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(AppLoggerService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const body = err.error as Record<string, unknown> | null | undefined;
      const apiError: ApiError = {
        message: (body?.['message'] as string) ?? err.message ?? 'Error desconocido',
        code: body?.['code'] as string | undefined,
        statusCode: err.status,
        requestId: (body?.['requestId'] as string) ?? req.headers.get('X-Request-Id') ?? undefined,
        data: body ?? undefined,
      };
      logger.error('api_error', { ...apiError, url: req.url });
      return throwError(() => apiError);
    }),
  );
};
