import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { authGuard } from './auth-guard';
import { AuthStore } from '../../features/auth/data-access/auth.store';

function runGuard(): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('authGuard', () => {
  const estaAutenticado = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthStore, useValue: { estaAutenticado } },
      ],
    });
  });

  it('CA-01: permite acceso cuando el usuario está autenticado', () => {
    estaAutenticado.mockReturnValue(true);
    expect(runGuard()).toBe(true);
  });

  it('CA-02: redirige a /login cuando no está autenticado', () => {
    estaAutenticado.mockReturnValue(false);
    const result = runGuard();
    const router = TestBed.inject(Router);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
