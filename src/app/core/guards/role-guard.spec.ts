import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { roleGuard } from './role-guard';
import { AuthStore } from '../../features/auth/data-access/auth.store';

function runGuard(roles: string[], userRol: string | null): boolean | UrlTree {
  const route = { data: { roles } } as unknown as ActivatedRouteSnapshot;
  return TestBed.runInInjectionContext(() =>
    roleGuard(route, {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('roleGuard', () => {
  const rol = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthStore, useValue: { rol } },
      ],
    });
  });

  it('CA-01: permite acceso cuando la ruta no requiere rol específico', () => {
    rol.mockReturnValue('cobrador');
    expect(runGuard([], 'cobrador')).toBe(true);
  });

  it('CA-02: permite acceso cuando el usuario tiene el rol requerido', () => {
    rol.mockReturnValue('admin');
    expect(runGuard(['admin', 'supervisor'], 'admin')).toBe(true);
  });

  it('CA-03: redirige a /dashboard cuando el rol no tiene acceso', () => {
    rol.mockReturnValue('cobrador');
    const result = runGuard(['admin'], 'cobrador');
    const router = TestBed.inject(Router);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  it('CA-04: permite acceso cuando el usuario es null pero la ruta no exige rol', () => {
    rol.mockReturnValue(null);
    expect(runGuard([], null)).toBe(true);
  });

  it('CA-05: redirige cuando el usuario es null y la ruta exige rol', () => {
    rol.mockReturnValue(null);
    const result = runGuard(['admin'], null);
    expect(result).toBeInstanceOf(UrlTree);
  });
});
