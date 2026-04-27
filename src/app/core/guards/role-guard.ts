import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../features/auth/data-access/auth.store';

export const roleGuard: CanActivateFn = (route) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const roles: string[] = route.data['roles'] ?? [];

  if (roles.length === 0 || roles.includes(store.rol() ?? '')) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
