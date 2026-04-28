import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthStore } from '../../features/auth/data-access/auth.store';

function getToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function setTokens(accessToken: string, refreshToken: string): void {
  const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
  storage.setItem('access_token', accessToken);
  storage.setItem('refresh_token', refreshToken);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = getToken('access_token');
  const authReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/login')) {
        const auth   = inject(AuthStore);
        const router = inject(Router);
        auth.cerrarSesionLocal();
        router.navigate(['/login'], { replaceUrl: true });
        return EMPTY;
      }
      throw err;
    }),
  );
};

export { setTokens };
