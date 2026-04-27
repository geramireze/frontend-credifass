import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { DashboardApiService } from './dashboard-api';
import { DashboardState, RangoDashboard, EstadoDistribucion } from './dashboard.model';

const ESTADO_COLORES: Record<string, string> = {
  al_dia: '#10B981',
  pendiente_por_vencer: '#F59E0B',
  en_mora: '#DC2626',
  pagado: '#6366F1',
  cancelado: '#64748B',
};

const estadoInicial: DashboardState = {
  kpis: null,
  series: null,
  rango: '30d',
  rangoFecha: null,
  loading: false,
  error: null,
  lastFetch: null,
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>(estadoInicial),
  withComputed((store) => ({
    chartLinea: computed(() => {
      const s = store.series();
      if (!s) return null;
      const fechas = s.recuperado_diario.map((d) => d.fecha);
      return {
        tooltip: { trigger: 'axis' },
        legend: { data: ['Recuperado', 'Cartera pendiente'] },
        xAxis: { type: 'category', data: fechas, axisLabel: { rotate: 30, fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `$${(v / 1_000_000).toFixed(1)}M` } },
        series: [
          { name: 'Recuperado', type: 'line', smooth: true, data: s.recuperado_diario.map((d) => d.valor), itemStyle: { color: '#10B981' } },
          { name: 'Cartera pendiente', type: 'line', smooth: true, data: (s.cartera_diaria ?? []).map((d) => d.valor), itemStyle: { color: '#DC2626' } },
        ],
      };
    }),
    chartBarraSemana: computed(() => {
      const s = store.series();
      if (!s) return null;
      return {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: s.pagos_por_dia_semana.map((d) => d.dia) },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `$${(v / 1_000_000).toFixed(1)}M` } },
        series: [{
          type: 'bar',
          data: s.pagos_por_dia_semana.map((d) => d.valor),
          itemStyle: { color: '#6366F1', borderRadius: [4, 4, 0, 0] },
        }],
      };
    }),
    chartDonut: computed(() => {
      const s = store.series();
      if (!s) return null;
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', right: 10, top: 'center' },
        series: [{
          type: 'pie',
          radius: ['45%', '70%'],
          data: s.estados_distribucion.map((d: EstadoDistribucion) => ({
            name: d.estado.replace('_', ' '),
            value: d.valor,
            itemStyle: { color: ESTADO_COLORES[d.estado] ?? '#9E9E9E' },
          })),
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        }],
      };
    }),
  })),
  withMethods((store, api = inject(DashboardApiService)) => ({
    async cargar(rango?: RangoDashboard): Promise<void> {
      const r = rango ?? store.rango();
      patchState(store, { loading: true, error: null, rango: r });
      try {
        const data = await api.getDashboard(r);
        patchState(store, { kpis: data.kpis, series: data.series, rangoFecha: data.rango, loading: false, lastFetch: Date.now() });
      } catch {
        patchState(store, { error: 'No se pudo cargar el dashboard.', loading: false });
      }
    },

    cambiarRango(rango: RangoDashboard): void {
      patchState(store, { rango });
    },
  })),
);
