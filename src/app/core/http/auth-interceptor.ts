import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthApiService } from '../../features/auth/data-access/auth-api';
import { Router } from '@angular/router';

function getToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function setTokens(accessToken: string, refreshToken: string): void {
  const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
  storage.setItem('access_token', accessToken);
  storage.setItem('refresh_token', refreshToken);
}

function clearTokens(): void {
  sessionStorage.clear();
  ['access_token', 'refresh_token', 'auth_user'].forEach((k) => localStorage.removeItem(k));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = getToken('access_token');
  const authReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        const api = inject(AuthApiService);
        const router = inject(Router);
        const refreshToken = getToken('refresh_token');

        if (!refreshToken) {
          clearTokens();
          router.navigate(['/login']);
          return throwError(() => err);
        }

        return api.refresh(refreshToken).pipe(
          switchMap((tokens) => {
            setTokens(tokens.accessToken, tokens.refreshToken);
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } });
            return next(retried);
          }),
          catchError(() => {
            clearTokens();
            router.navigate(['/login']);
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
