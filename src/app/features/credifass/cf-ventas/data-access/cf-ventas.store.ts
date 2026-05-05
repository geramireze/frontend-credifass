import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CfVentasApi } from './cf-ventas-api';
import type { CfVentasState, CfVentasFiltros, ActualizarVentaDto, CrearVentaDto, RegistrarPagoDto, RegistrarAbonoDto, IntervaloVenta } from './cf-ventas.model';

const inicial: CfVentasState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filtros: {},
  seleccionado: null,
  simulacion: null,
  loading: false,
  loadingDetalle: false,
  error: null,
};

export const CfVentasStore = signalStore(
  { providedIn: 'root' },
  withState<CfVentasState>(inicial),
  withMethods((store, api = inject(CfVentasApi)) => ({
    async cargarLista(filtros?: CfVentasFiltros): Promise<void> {
      const f = filtros ?? store.filtros();
      patchState(store, { loading: true, error: null, filtros: f });
      try {
        const res = await api.listar({ ...f, page: store.page(), pageSize: store.pageSize() });
        patchState(store, { items: res.items, total: res.total, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar las ventas.' });
      }
    },

    async cargarDetalle(id: string): Promise<void> {
      patchState(store, { loadingDetalle: true, error: null });
      try {
        const venta = await api.obtener(id);
        if (venta.tipo === 'abono') {
          const abonos = await api.listarAbonos(id);
          patchState(store, { seleccionado: { ...venta, abonos }, loadingDetalle: false });
        } else {
          const [cuotas, pagos] = await Promise.all([
            api.obtenerCuotas(id),
            api.obtenerPagos(id),
          ]);
          patchState(store, { seleccionado: { ...venta, cuotas, pagos }, loadingDetalle: false });
        }
      } catch {
        patchState(store, { loadingDetalle: false, error: 'No se pudo cargar la venta.' });
      }
    },

    async simularCuotas(totalVenta: string, nCuotas: number, fechaInicio: string, intervalo: IntervaloVenta): Promise<void> {
      try {
        const simulacion = await api.simular(totalVenta, nCuotas, fechaInicio, intervalo);
        patchState(store, { simulacion });
      } catch {
        patchState(store, { simulacion: null });
      }
    },

    async crear(dto: CrearVentaDto): Promise<string> {
      patchState(store, { loading: true, error: null });
      try {
        const venta = await api.crear(dto);
        await this.cargarLista();
        return venta.id;
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    async registrarPago(ventaId: string, dto: RegistrarPagoDto): Promise<void> {
      try {
        await api.registrarPago(ventaId, dto);
        await this.cargarDetalle(ventaId);
      } catch (err: unknown) {
        throw err;
      }
    },

    async registrarAbono(ventaId: string, dto: RegistrarAbonoDto): Promise<void> {
      const idempotencyKey = crypto.randomUUID();
      await api.registrarAbono(ventaId, dto, idempotencyKey);
      await this.cargarDetalle(ventaId);
    },

    async actualizar(id: string, dto: ActualizarVentaDto): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.actualizar(id, dto);
        await this.cargarDetalle(id);
        patchState(store, { loading: false });
      } catch (err: unknown) {
        patchState(store, { loading: false });
        throw err;
      }
    },

    limpiarSimulacion(): void {
      patchState(store, { simulacion: null });
    },

    cambiarPagina(page: number): void {
      patchState(store, { page });
      this.cargarLista();
    },
  })),
);
