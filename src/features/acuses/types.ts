export type AcuseEstado = 'Pendiente' | 'En Reparto' | 'Entregado' | 'Anulado';

export const ACUSE_ESTADOS: AcuseEstado[] = ['Pendiente', 'En Reparto', 'Entregado', 'Anulado'];

/** Clave de UI normalizada para colores/íconos. */
export function estadoKey(estado: string | null | undefined): 'pendiente' | 'en_reparto' | 'entregado' | 'anulado' {
  const n = String(estado ?? '').toLowerCase();
  if (n.includes('entreg') || n.includes('termin') || n.includes('complet')) return 'entregado';
  if (n.includes('reparto') || n.includes('transit') || n.includes('tránsit')) return 'en_reparto';
  if (n.includes('anul') || n.includes('cancel')) return 'anulado';
  return 'pendiente';
}

export interface AcuseRow {
  id: number;
  nro_acuse: string;
  cod_cliente: string | null;
  cliente_nombre: string | null;
  cliente_ciudad: string | null;
  zona: string | null;
  estado: string;
  fecha_emision: string;
  fecha_entrega: string | null;
  repartidor_id: number | null;
  repartidor_nombre: string | null;
  observacion: string | null;
  usuario: string | null;
  activo: boolean;
  created_at: string;
  items: number;
  unidades: number;
}

export interface AcuseDetalle {
  id?: number;
  cod_mercaderia: string;
  descripcion: string | null;
  cantidad: number;
  um: string | null;
  nota: string | null;
}

export interface Repartidor {
  id: number;
  codigo: string | null;
  nombre: string;
  activo: boolean;
}

export interface ClienteCat {
  cod_cliente: string;
  nombre: string | null;
  ruc: string | null;
  direccion: string | null;
  ciudad: string | null;
  zona: string | null;
  telefono: string | null;
}

export interface ArticuloCat {
  material: string;
  descripcion: string | null;
  um: string | null;
  status: string | null;
}

export interface AcuseSummary {
  pendiente: number;
  en_reparto: number;
  entregado: number;
  anulado: number;
}

export interface AcuseDashboard {
  total: number;
  pendientes: number;
  enReparto: number;
  entregados: number;
  anulados: number;
  hoy: number;
  proximas: number;
  repartidores: number;
  porDia: { fecha: string; total: number }[];
  live: boolean;
}

export interface AcuseFilters {
  estado?: 'all' | AcuseEstado;
  search?: string;
  repartidorId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}
