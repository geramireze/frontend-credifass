export type RolUsuario = 'admin' | 'supervisor' | 'cobrador';

export interface Rol {
  id: string;
  codigo: string;
  nombre: string;
  permissions: Record<string, boolean>;
}

export interface PermisoCatalogo {
  key: string;
  label: string;
  descripcion: string;
}

export const PERMISOS_CATALOGO: PermisoCatalogo[] = [
  { key: 'prestamos.fecha_pasada', label: 'Fechas pasadas',    descripcion: 'Registrar préstamos con fecha de inicio en el pasado' },
  { key: 'prestamos.create',       label: 'Crear préstamos',   descripcion: 'Crear nuevos préstamos para clientes' },
  { key: 'prestamos.edit',         label: 'Editar préstamos',  descripcion: 'Modificar cobrador, mora y observaciones de un préstamo activo' },
  { key: 'prestamos.cancel',       label: 'Cancelar préstamos', descripcion: 'Cancelar préstamos activos' },
  { key: 'pagos.create',           label: 'Registrar pagos',   descripcion: 'Registrar pagos de cuotas' },
  { key: 'pagos.void',             label: 'Anular pagos',      descripcion: 'Anular pagos ya registrados' },
  { key: 'reportes.all',           label: 'Reportes completos', descripcion: 'Ver reportes de todos los cobradores' },
  { key: 'auditoria.read',         label: 'Ver auditoría',     descripcion: 'Acceder al registro de auditoría' },
  { key: 'usuarios.manage',        label: 'Gestionar usuarios', descripcion: 'Crear, editar y desactivar usuarios' },
  { key: 'parametros.edit',        label: 'Editar parámetros', descripcion: 'Modificar parámetros del sistema' },
];

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
