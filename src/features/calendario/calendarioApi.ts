import { supabaseCal, isCalReady } from '@/lib/supabaseCalendario';
import type { Tarea, NuevaTarea } from './types';

/* ─────────────────────────── DEMO (mock) ─────────────────────────── */
let MOCK: Tarea[] = (() => {
  const iso = (off: number) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };
  return [
    { id: 1, titulo: 'Revisar recepción de hierros', descripcion: 'Control de calidad lote 200', fecha: iso(0), hora: '09:00', responsable: 'David Espinola', deposito: 'Depósito Central', prioridad: 'ALTA', estado: 'Pendiente', usuario: 'David Espinola', created_at: new Date().toISOString() },
    { id: 2, titulo: 'Cargar acuses del día', descripcion: null, fecha: iso(0), hora: '14:00', responsable: 'Elias Cabrera', deposito: 'Depósito Central', prioridad: 'NORMAL', estado: 'En curso', usuario: 'David Espinola', created_at: new Date().toISOString() },
    { id: 3, titulo: 'Inventario depósito Luque', descripcion: 'Conteo cíclico', fecha: iso(2), hora: null, responsable: 'Jonathan Peralta', deposito: 'Depósito Luque Sanber', prioridad: 'NORMAL', estado: 'Pendiente', usuario: 'David Espinola', created_at: new Date().toISOString() },
    { id: 4, titulo: 'Cierre semanal de flete', descripcion: null, fecha: iso(-1), hora: '17:00', responsable: 'Lisandro López', deposito: 'Fábrica', prioridad: 'BAJA', estado: 'Hecho', usuario: 'David Espinola', created_at: new Date().toISOString() },
    { id: 5, titulo: 'Mantenimiento de montacargas', descripcion: 'Sala 2', fecha: iso(4), hora: '10:30', responsable: 'David Espinola', deposito: 'Fábrica', prioridad: 'ALTA', estado: 'Pendiente', usuario: 'David Espinola', created_at: new Date().toISOString() },
  ];
})();
let mockSeq = 100;

/* ─────────────────────────── Lecturas ─────────────────────────── */
export async function listTareas(fromISO: string, toISO: string, deposito?: string): Promise<{ rows: Tarea[]; live: boolean }> {
  if (!isCalReady || !supabaseCal) {
    let rows = MOCK.filter((t) => t.fecha >= fromISO && t.fecha <= toISO);
    if (deposito) rows = rows.filter((t) => t.deposito === deposito);
    return { rows, live: false };
  }
  let q = supabaseCal
    .from('tareas')
    .select('id,titulo,descripcion,fecha,hora,responsable,deposito,prioridad,estado,usuario,created_at')
    .gte('fecha', fromISO).lte('fecha', toISO);
  if (deposito) q = q.eq('deposito', deposito);
  const { data, error } = await q.order('fecha').order('hora', { nullsFirst: true });
  if (error) { console.error('[calendario] listTareas', error); return { rows: [], live: true }; }
  return { rows: (data ?? []) as Tarea[], live: true };
}

/* ─────────────────────────── Escrituras ─────────────────────────── */
export async function createTarea(input: NuevaTarea): Promise<Tarea> {
  if (!isCalReady || !supabaseCal) {
    const t: Tarea = { id: mockSeq++, created_at: new Date().toISOString(), descripcion: null, hora: null, responsable: null, deposito: null, usuario: null, ...input } as Tarea;
    MOCK = [...MOCK, t];
    return t;
  }
  const { data, error } = await supabaseCal.from('tareas').insert(input).select().single();
  if (error) throw error;
  return data as Tarea;
}

export async function updateTarea(id: number, input: Partial<NuevaTarea>): Promise<void> {
  if (!isCalReady || !supabaseCal) {
    MOCK = MOCK.map((t) => (t.id === id ? { ...t, ...input } as Tarea : t));
    return;
  }
  const { error } = await supabaseCal.from('tareas').update(input).eq('id', id);
  if (error) throw error;
}

export async function changeEstadoTarea(id: number, estado: string): Promise<void> {
  return updateTarea(id, { estado });
}

export async function deleteTarea(id: number): Promise<void> {
  if (!isCalReady || !supabaseCal) { MOCK = MOCK.filter((t) => t.id !== id); return; }
  const { error } = await supabaseCal.from('tareas').delete().eq('id', id);
  if (error) throw error;
}
