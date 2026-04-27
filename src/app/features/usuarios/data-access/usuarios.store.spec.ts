import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { UsuariosStore } from './usuarios.store';
import { UsuariosApiService } from './usuarios-api';
import { UsuarioListItem } from './usuarios.model';

const mockAdmin: UsuarioListItem = {
  id: 'u1',
  nombre: 'Admin Test',
  email: 'admin@test.com',
  rol: 'admin',
  activo: true,
  created_at: '2024-01-01T00:00:00Z',
};

describe('UsuariosStore', () => {
  const listar = vi.fn();
  const crear = vi.fn();
  const editar = vi.fn();
  const desactivar = vi.fn();
  const reactivar = vi.fn();
  const resetPassword = vi.fn();

  let store: InstanceType<typeof UsuariosStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: UsuariosApiService,
          useValue: { listar, crear, editar, desactivar, reactivar, resetPassword },
        },
      ],
    });
    store = TestBed.inject(UsuariosStore);
  });

  it('CA-01: estado inicial vacío', () => {
    expect(store.items()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('CA-02: cargar() carga la lista de usuarios', async () => {
    listar.mockResolvedValue({ items: [mockAdmin], total: 1 });

    await TestBed.runInInjectionContext(() => store.cargar());

    expect(store.items()).toHaveLength(1);
    expect(store.items()[0].email).toBe('admin@test.com');
    expect(store.total()).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('CA-03: cargar() guarda error cuando la API falla', async () => {
    listar.mockRejectedValue(new Error('network'));

    await TestBed.runInInjectionContext(() => store.cargar());

    expect(store.error()).toBe('No se pudo cargar los usuarios.');
    expect(store.loading()).toBe(false);
  });

  it('CA-04: crear() guarda la contraseña temporal', async () => {
    crear.mockResolvedValue({ ...mockAdmin, password_temporal: 'Tmp123!' });
    listar.mockResolvedValue({ items: [mockAdmin], total: 1 });

    await TestBed.runInInjectionContext(() =>
      store.crear({ nombre: 'Admin Test', email: 'admin@test.com', rolCodigo: 'admin' }),
    );

    expect(store.passwordTemporal()).toBe('Tmp123!');
  });

  it('CA-05: toggleActivo() con desactivar exitoso recarga lista', async () => {
    desactivar.mockResolvedValue(undefined);
    listar.mockResolvedValue({ items: [{ ...mockAdmin, activo: false }], total: 1 });

    await TestBed.runInInjectionContext(() => store.toggleActivo('u1', true));

    expect(store.items()[0].activo).toBe(false);
  });

  it('CA-06: toggleActivo() guarda error CANNOT_DEACTIVATE_LAST_ADMIN', async () => {
    desactivar.mockRejectedValue({ code: 'CANNOT_DEACTIVATE_LAST_ADMIN' });

    await TestBed.runInInjectionContext(() => store.toggleActivo('u1', true));

    expect(store.error()).toBe('No puedes desactivar al único administrador activo.');
  });

  it('CA-07: resetPassword() guarda contraseña temporal', async () => {
    resetPassword.mockResolvedValue({ password_temporal: 'NewPass99!' });

    await TestBed.runInInjectionContext(() => store.resetPassword('u1'));

    expect(store.passwordTemporal()).toBe('NewPass99!');
  });

  it('CA-08: limpiarError() limpia el error', async () => {
    listar.mockRejectedValue(new Error('err'));
    await TestBed.runInInjectionContext(() => store.cargar());
    expect(store.error()).not.toBeNull();

    TestBed.runInInjectionContext(() => store.limpiarError());
    expect(store.error()).toBeNull();
  });

  it('CA-09: limpiarPasswordTemporal() limpia la contraseña', async () => {
    resetPassword.mockResolvedValue({ password_temporal: 'Tmp!' });
    await TestBed.runInInjectionContext(() => store.resetPassword('u1'));
    expect(store.passwordTemporal()).toBe('Tmp!');

    TestBed.runInInjectionContext(() => store.limpiarPasswordTemporal());
    expect(store.passwordTemporal()).toBeNull();
  });

  it('CA-10: editar() exitoso recarga la lista', async () => {
    const updatedUser = { ...mockAdmin, nombre: 'Admin Editado' };
    editar.mockResolvedValue(updatedUser);
    listar.mockResolvedValue({ items: [updatedUser], total: 1 });

    await TestBed.runInInjectionContext(() => store.editar('u1', { nombre: 'Admin Editado' }));

    expect(store.items()[0].nombre).toBe('Admin Editado');
  });

  it('CA-11: editar() error guarda mensaje y relanza', async () => {
    editar.mockRejectedValue(new Error('conflict'));

    await expect(
      TestBed.runInInjectionContext(() => store.editar('u1', { nombre: 'X' })),
    ).rejects.toThrow('Error al editar usuario');
    expect(store.error()).toBe('No se pudo actualizar el usuario.');
  });

  it('CA-12: crear() error guarda mensaje y relanza', async () => {
    crear.mockRejectedValue(new Error('duplicate'));

    await expect(
      TestBed.runInInjectionContext(() =>
        store.crear({ nombre: 'X', email: 'x@x.com', rolCodigo: 'cobrador' }),
      ),
    ).rejects.toThrow('Error al crear usuario');
    expect(store.error()).toBe('No se pudo crear el usuario.');
  });

  it('CA-13: toggleActivo() con reactivar (activo=false) recarga lista', async () => {
    reactivar.mockResolvedValue(undefined);
    listar.mockResolvedValue({ items: [{ ...mockAdmin, activo: true }], total: 1 });

    await TestBed.runInInjectionContext(() => store.toggleActivo('u1', false));

    expect(store.items()[0].activo).toBe(true);
    expect(reactivar).toHaveBeenCalledWith('u1');
  });

  it('CA-14: toggleActivo() error genérico guarda mensaje genérico', async () => {
    desactivar.mockRejectedValue(new Error('unknown'));

    await TestBed.runInInjectionContext(() => store.toggleActivo('u1', true));

    expect(store.error()).toBe('No se pudo cambiar el estado del usuario.');
  });
});
