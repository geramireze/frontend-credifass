export type RolUsuario = 'admin' | 'supervisor' | 'cobrador';

export interface UsuarioListItem {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
}

export interface CrearUsuarioDto {
  nombre: string;
  email: string;
  rolCodigo: RolUsuario;
}

export interface CrearUsuarioResponse extends UsuarioListItem {
  password_temporal: string;
}

export interface EditarUsuarioDto {
  nombre?: string;
  rolCodigo?: RolUsuario;
}

export interface UsuariosState {
  items: UsuarioListItem[];
  total: number;
  loading: boolean;
  error: string | null;
  passwordTemporal: string | null;
}
