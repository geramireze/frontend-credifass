export type EstadoProducto = 'disponible' | 'reservado' | 'agotado' | 'inactivo';

export interface CfProducto {
  id: string;
  categoriaId: string | null;
  categoriaNombre: string | null;
  nombre: string;
  descripcion: string | null;
  valorCompra: string;
  valorVenta: string;
  stockDisponible: number;
  stockReservado: number;
  estado: EstadoProducto;
  activo: boolean;
}

export interface CfProductosFiltros {
  q?: string;
  estado?: EstadoProducto | '';
  stockBajo?: boolean;
  categoriaId?: string;
  page?: number;
  pageSize?: number;
}

export interface CfProductosState {
  items: CfProducto[];
  total: number;
  page: number;
  pageSize: number;
  filtros: CfProductosFiltros;
  seleccionado: CfProducto | null;
  loading: boolean;
  error: string | null;
}

export interface CrearProductoDto {
  nombre: string;
  descripcion?: string;
  categoriaId?: string;
  valorCompra: string;
  valorVenta: string;
  stockInicial: number;
}
