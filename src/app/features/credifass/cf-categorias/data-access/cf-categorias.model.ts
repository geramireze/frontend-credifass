export interface CfCategoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CfCategoriasState {
  items: CfCategoria[];
  loading: boolean;
  error: string | null;
}
