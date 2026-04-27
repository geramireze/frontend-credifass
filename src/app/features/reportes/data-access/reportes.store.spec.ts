import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { ReportesStore } from './reportes.store';
import { ReportesApiService } from './reportes-api';
import { ReporteResponse } from './reportes.model';

const mockResponse: ReporteResponse = {
  filtros_aplicados: {},
  total: 2,
  page: 1,
  pageSize: 20,
  items: [
    { cliente_nombre: 'Juan', monto_vencido: 100000 },
    { cliente_nombre: 'Pedro', monto_vencido: 200000 },
  ],
  totales: { total_vencido: 300000 },
};

describe('ReportesStore', () => {
  const obtener = vi.fn();

  let store: InstanceType<typeof ReportesStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: ReportesApiService, useValue: { obtener } },
      ],
    });
    store = TestBed.inject(ReportesStore);
  });

  it('CA-01: estado inicial sin reporte activo', () => {
    expect(store.reporteActivo()).toBeNull();
    expect(store.datos()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('CA-02: seleccionar() activa el tipo y carga datos', async () => {
    obtener.mockResolvedValue(mockResponse);

    await TestBed.runInInjectionContext(() => store.seleccionar('clientes-mora'));

    expect(store.reporteActivo()).toBe('clientes-mora');
    expect(store.datos()?.total).toBe(2);
    expect(store.datos()?.items).toHaveLength(2);
    expect(store.loading()).toBe(false);
  });

  it('CA-03: cargar() sin reporte activo no llama a la API', async () => {
    await TestBed.runInInjectionContext(() => store.cargar());

    expect(obtener).not.toHaveBeenCalled();
    expect(store.datos()).toBeNull();
  });

  it('CA-04: cargar() guarda error cuando la API falla', async () => {
    obtener.mockResolvedValue(mockResponse);
    await TestBed.runInInjectionContext(() => store.seleccionar('clientes-mora'));

    obtener.mockRejectedValue(new Error('error'));
    await TestBed.runInInjectionContext(() => store.cargar());

    expect(store.error()).toBe('No se pudo cargar el reporte.');
  });

  it('CA-05: aplicarFiltros() aplica filtros y reinicia página', async () => {
    obtener.mockResolvedValue(mockResponse);
    await TestBed.runInInjectionContext(() => store.seleccionar('clientes-mora'));

    await TestBed.runInInjectionContext(() =>
      store.aplicarFiltros({ from: '2024-01-01', to: '2024-12-31' }),
    );

    expect(store.filtros().from).toBe('2024-01-01');
    expect(store.filtros().page).toBe(1);
  });

  it('CA-06: cambiarPagina() actualiza filtros con nueva página', async () => {
    obtener.mockResolvedValue(mockResponse);
    await TestBed.runInInjectionContext(() => store.seleccionar('clientes-mora'));

    await TestBed.runInInjectionContext(() => store.cambiarPagina(3));

    expect(store.filtros().page).toBe(3);
  });

  it('CA-07: seleccionar() reset filtros al cambiar de reporte', async () => {
    obtener.mockResolvedValue(mockResponse);
    await TestBed.runInInjectionContext(() => store.seleccionar('clientes-mora'));
    await TestBed.runInInjectionContext(() => store.aplicarFiltros({ from: '2024-01-01' }));

    await TestBed.runInInjectionContext(() => store.seleccionar('ganancias'));

    expect(store.filtros().from).toBeUndefined();
    expect(store.filtros().page).toBe(1);
    expect(store.reporteActivo()).toBe('ganancias');
  });

  it('CA-08: limpiarError() limpia el error', async () => {
    obtener.mockResolvedValue(mockResponse);
    await TestBed.runInInjectionContext(() => store.seleccionar('ganancias'));
    obtener.mockRejectedValue(new Error());
    await TestBed.runInInjectionContext(() => store.cargar());
    expect(store.error()).not.toBeNull();

    TestBed.runInInjectionContext(() => store.limpiarError());
    expect(store.error()).toBeNull();
  });
});
