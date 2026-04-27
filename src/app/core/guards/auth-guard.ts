import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../features/auth/data-access/auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.estaAutenticado()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
