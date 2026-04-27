import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { AuthApiService } from './auth-api';
import { AuthState, LoginRequest, UsuarioAutenticado } from './auth.model';

const STORAGE_KEY = 'auth_user';

function cargarUsuarioInicial(): UsuarioAutenticado | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UsuarioAutenticado) : null;
  } catch {
    return null;
  }
}

function resolverStorage(recordarme: boolean): Storage {
  return recordarme ? localStorage : sessionStorage;
}

const estadoInicial: AuthState = {
  usuario: cargarUsuarioInicial(),
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(estadoInicial),
  withComputed((store) => ({
    estaAutenticado: computed(() => store.usuario() !== null),
    rol: computed(() => store.usuario()?.rol ?? null),
    tienePermiso: computed(() => (permiso: string) => store.usuario()?.permisos[permiso] ?? false),
  })),
  withMethods((store, api = inject(AuthApiService), router = inject(Router)) => ({
    async login(credenciales: LoginRequest, recordarme = false): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const { user, accessToken, refreshToken } = await api.login(credenciales);
        const storage = resolverStorage(recordarme);
        storage.setItem(STORAGE_KEY, JSON.stringify(user));
        storage.setItem('access_token', accessToken);
        storage.setItem('refresh_token', refreshToken);
        patchState(store, { usuario: user, loading: false });
        await router.navigate(['/dashboard']);
      } catch (err: unknown) {
        const mensaje = err instanceof Error ? err.message : 'Error al iniciar sesión';
        patchState(store, { error: mensaje, loading: false });
      }
    },

    async logout(): Promise<void> {
      await api.logout().catch(() => undefined);
      sessionStorage.clear();
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      patchState(store, { usuario: null, error: null });
      await router.navigate(['/login']);
    },

    limpiarError(): void {
      patchState(store, { error: null });
    },
  })),
);
