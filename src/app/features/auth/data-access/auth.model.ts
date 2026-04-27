export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'supervisor' | 'cobrador';
  permisos: Record<string, boolean>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UsuarioAutenticado;
}

export interface AuthState {
  usuario: UsuarioAutenticado | null;
  loading: boolean;
  error: string | null;
}
