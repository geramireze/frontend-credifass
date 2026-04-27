import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { AuthStore } from './auth.store';
import { AuthApiService } from './auth-api';
import { UsuarioAutenticado } from './auth.model';

const mockUser: UsuarioAutenticado = {
  id: 'u1',
  nombre: 'Admin',
  email: 'admin@test.com',
  rol: 'admin',
  permisos: { ver_reportes: true },
};

const dummyRoutes = [
  { path: 'login', component: class {} },
  { path: 'dashboard', component: class {} },
];

describe('AuthStore', () => {
  const login = vi.fn();
  const logout = vi.fn();
  const refresh = vi.fn();

  function setup(): InstanceType<typeof AuthStore> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(dummyRoutes),
        provideHttpClient(),
        { provide: AuthApiService, useValue: { login, logout, refresh } },
      ],
    });
    return TestBed.inject(AuthStore);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('CA-01: estado inicial sin usuario', () => {
    const store = setup();
    expect(store.usuario()).toBeNull();
    expect(store.estaAutenticado()).toBe(false);
    expect(store.rol()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('CA-02: login exitoso guarda usuario y tokens en sessionStorage', async () => {
    login.mockResolvedValue({ user: mockUser, accessToken: 'acc-token', refreshToken: 'ref-token' });
    const store = setup();

    await TestBed.runInInjectionContext(() =>
      store.login({ email: 'admin@test.com', password: 'pass' }),
    );

    expect(store.usuario()?.email).toBe('admin@test.com');
    expect(store.estaAutenticado()).toBe(true);
    expect(store.rol()).toBe('admin');
    expect(sessionStorage.getItem('access_token')).toBe('acc-token');
  });

  it('CA-03: login fallido guarda error', async () => {
    login.mockRejectedValue(new Error('Credenciales inválidas'));
    const store = setup();

    await TestBed.runInInjectionContext(() =>
      store.login({ email: 'x@x.com', password: 'wrong' }),
    );

    expect(store.usuario()).toBeNull();
    expect(store.error()).toBe('Credenciales inválidas');
    expect(store.loading()).toBe(false);
  });

  it('CA-04: logout limpia sessionStorage y estado', async () => {
    login.mockResolvedValue({ user: mockUser, accessToken: 'acc', refreshToken: 'ref' });
    logout.mockResolvedValue(undefined);
    const store = setup();

    await TestBed.runInInjectionContext(() =>
      store.login({ email: 'admin@test.com', password: 'pass' }),
    );
    await TestBed.runInInjectionContext(() => store.logout());

    expect(store.usuario()).toBeNull();
    expect(store.estaAutenticado()).toBe(false);
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('CA-05: logout no falla aunque la API de logout falle', async () => {
    login.mockResolvedValue({ user: mockUser, accessToken: 'acc', refreshToken: 'ref' });
    logout.mockRejectedValue(new Error('network'));
    const store = setup();

    await TestBed.runInInjectionContext(() =>
      store.login({ email: 'admin@test.com', password: 'pass' }),
    );
    await TestBed.runInInjectionContext(() => store.logout());

    expect(store.usuario()).toBeNull();
  });

  it('CA-06: tienePermiso() devuelve true para permiso existente', async () => {
    login.mockResolvedValue({ user: mockUser, accessToken: 'acc', refreshToken: 'ref' });
    const store = setup();
    await TestBed.runInInjectionContext(() =>
      store.login({ email: 'admin@test.com', password: 'pass' }),
    );

    expect(store.tienePermiso()('ver_reportes')).toBe(true);
    expect(store.tienePermiso()('no_existe')).toBe(false);
  });

  it('CA-07: limpiarError() limpia el error', async () => {
    login.mockRejectedValue(new Error('error'));
    const store = setup();
    await TestBed.runInInjectionContext(() =>
      store.login({ email: 'x@x.com', password: 'y' }),
    );
    expect(store.error()).not.toBeNull();

    TestBed.runInInjectionContext(() => store.limpiarError());
    expect(store.error()).toBeNull();
  });

});
