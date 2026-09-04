export type TareaEstado = 'Pendiente' | 'En curso' | 'Hecho';
export type TareaPrioridad = 'BAJA' | 'NORMAL' | 'ALTA';

export const TAREA_ESTADOS: TareaEstado[] = ['Pendiente', 'En curso', 'Hecho'];
export const TAREA_PRIORIDADES: TareaPrioridad[] = ['BAJA', 'NORMAL', 'ALTA'];

export function estadoKey(e: string | null | undefined): 'pendiente' | 'en_curso' | 'hecho' {
  const n = String(e ?? '').toLowerCase();
  if (n.includes('curso') || n.includes('proceso')) return 'en_curso';
  if (n.includes('hech') || n.includes('complet') || n.includes('termin')) return 'hecho';
  return 'pendiente';
}

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;            // YYYY-MM-DD
  hora: string | null;      // HH:MM
  responsable: string | null;
  prioridad: TareaPrioridad | string;
  estado: TareaEstado | string;
  usuario: string | null;
  created_at: string;
}

export interface NuevaTarea {
  titulo: string;
  descripcion?: string | null;
  fecha: string;
  hora?: string | null;
  responsable?: string | null;
  prioridad: string;
  estado: string;
  usuario?: string | null;
}
