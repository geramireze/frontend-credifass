import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { AuditoriaStore } from './auditoria.store';
import { AuditoriaApiService } from './auditoria-api';
import { AuditoriaItem, AuditoriaResponse } from './auditoria.model';

const mockItem: AuditoriaItem = {
  id: 'a1',
  accion: 'CREATE_PRESTAMO',
  entidad: 'prestamos',
  entidad_id: 'p1',
  usuario_id: 'u1',
  usuario_nombre: 'Admin',
  ip: '127.0.0.1',
  request_id: 'req-1',
  payload_nuevo: { monto: 1000000 },
  payload_anterior: null,
  created_at: '2024-06-01T10:00:00Z',
};

const mockResponse: AuditoriaResponse = {
  total: 1,
  page: 1,
  pageSize: 20,
  items: [mockItem],
};

describe('AuditoriaStore', () => {
  const listar = vi.fn();

  let store: InstanceType<typeof AuditoriaStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: AuditoriaApiService, useValue: { listar } },
      ],
    });
    store = TestBed.inject(AuditoriaStore);
  });

  it('CA-01: estado inicial vacío', () => {
    expect(store.items()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.page()).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('CA-02: cargar() carga registros de auditoría', async () => {
    listar.mockResolvedValue(mockResponse);

    await TestBed.runInInjectionContext(() => store.cargar());

    expect(store.items()).toHaveLength(1);
    expect(store.items()[0].accion).toBe('CREATE_PRESTAMO');
    expect(store.total()).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('CA-03: cargar() aplica filtros al estado', async () => {
    listar.mockResolvedValue(mockResponse);

    await TestBed.runInInjectionContext(() =>
      store.cargar({ accion: 'LOGIN', entidad: 'auth' }),
    );

    expect(store.filtros().accion).toBe('LOGIN');
    expect(store.filtros().entidad).toBe('auth');
  });

  it('CA-04: cargar() guarda error cuando la API falla', async () => {
    listar.mockRejectedValue(new Error('network'));

    await TestBed.runInInjectionContext(() => store.cargar());

    expect(store.error()).toBe('No se pudo cargar el registro de auditoría.');
    expect(store.loading()).toBe(false);
  });

  it('CA-05: cambiarPagina() llama cargar con la nueva página', async () => {
    listar.mockResolvedValue({ ...mockResponse, page: 2 });

    await TestBed.runInInjectionContext(() => store.cambiarPagina(2));

    expect(listar).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    expect(store.page()).toBe(2);
  });

  it('CA-06: cargar() mantiene filtros previos y fusiona nuevos', async () => {
    listar.mockResolvedValue(mockResponse);
    await TestBed.runInInjectionContext(() => store.cargar({ accion: 'LOGIN' }));

    await TestBed.runInInjectionContext(() => store.cargar({ entidad: 'clientes' }));

    expect(store.filtros().accion).toBe('LOGIN');
    expect(store.filtros().entidad).toBe('clientes');
  });

  it('CA-07: limpiarError() limpia el error', async () => {
    listar.mockRejectedValue(new Error());
    await TestBed.runInInjectionContext(() => store.cargar());
    expect(store.error()).not.toBeNull();

    TestBed.runInInjectionContext(() => store.limpiarError());
    expect(store.error()).toBeNull();
  });
});
