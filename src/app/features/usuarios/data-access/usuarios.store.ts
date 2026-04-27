import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { UsuariosApiService } from './usuarios-api';
import { UsuariosState, CrearUsuarioDto, EditarUsuarioDto } from './usuarios.model';

const estadoInicial: UsuariosState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  passwordTemporal: null,
};

export const UsuariosStore = signalStore(
  { providedIn: 'root' },
  withState<UsuariosState>(estadoInicial),
  withMethods((store, api = inject(UsuariosApiService)) => ({
    async cargar(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await api.listar();
        patchState(store, { items: res.items, total: res.total, loading: false });
      } catch {
        patchState(store, { error: 'No se pudo cargar los usuarios.', loading: false });
      }
    },

    async crear(dto: CrearUsuarioDto): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await api.crear(dto);
        patchState(store, { passwordTemporal: res.passwordTemporal, loading: false });
        await this.cargar();
      } catch {
        patchState(store, { error: 'No se pudo crear el usuario.', loading: false });
        throw new Error('Error al crear usuario');
      }
    },

    async editar(id: string, dto: EditarUsuarioDto): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await api.editar(id, dto);
        await this.cargar();
      } catch {
        patchState(store, { error: 'No se pudo actualizar el usuario.', loading: false });
        throw new Error('Error al editar usuario');
      }
    },

    async toggleActivo(id: string, activo: boolean): Promise<void> {
      try {
        activo ? await api.desactivar(id) : await api.reactivar(id);
        await this.cargar();
      } catch (e: unknown) {
        const err = e as { code?: string };
        if (err?.code === 'CANNOT_DEACTIVATE_LAST_ADMIN') {
          patchState(store, { error: 'No puedes desactivar al único administrador activo.' });
        } else {
          patchState(store, { error: 'No se pudo cambiar el estado del usuario.' });
        }
      }
    },

    async resetPassword(id: string): Promise<string> {
      const res = await api.resetPassword(id);
      patchState(store, { passwordTemporal: res.passwordTemporal });
      return res.passwordTemporal;
    },

    limpiarPasswordTemporal(): void {
      patchState(store, { passwordTemporal: null });
    },

    limpiarError(): void {
      patchState(store, { error: null });
    },
  })),
);
