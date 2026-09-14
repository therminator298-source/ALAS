import { supabaseCal, isCalReady } from '@/lib/supabaseCalendario';
import type { Tarea, NuevaTarea } from './types';

/* ─────────────────────────── DEMO (mock) ─────────────────────────── */
let MOCK: Tarea[] = (() => {
  const iso = (off: number) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };
  const base = [
    { id: 1, titulo: 'Revisar recepción de hierros', descripcion: 'Control de calidad lote 200', fecha: iso(0), hora: '09:00', responsable: 'David Espinola', deposito: 'Depósito Central', estado: 'Pendiente', usuario: 'David Espinola', created_at: new Date().toISOString() },
    { id: 2, titulo: 'Cargar acuses del día', descripcion: null, fecha: iso(0), hora: '14:00', responsable: 'Elias Cabrera', deposito: 'Depósito Central', estado: 'En curso', usuario: 'David Espinola', created_at: new Date().toISOString() },
    { id: 3, titulo: 'Inventario depósito Luque', descripcion: 'Conteo cíclico', fecha: iso(2), hora: null, responsable: 'Jonathan Peralta', deposito: 'Depósito Luque Sanber', estado: 'Pendiente', usuario: 'David Espinola', created_at: new Date().toISOString() },
    { id: 4, titulo: 'Cierre semanal de flete', descripcion: null, fecha: iso(-1), hora: '17:00', responsable: 'Lisandro López', deposito: 'Fábrica', estado: 'Hecho', usuario: 'David Espinola', created_at: new Date().toISOString() },
    { id: 5, titulo: 'Mantenimiento de montacargas', descripcion: 'Sala 2', fecha: iso(4), hora: '10:30', responsable: 'David Espinola', deposito: 'Fábrica', estado: 'Pendiente', usuario: 'David Espinola', created_at: new Date().toISOString() },
  ];
  return base.map((t, i) => ({ ...t, orden: i }));
})();
let mockSeq = 100;

const COLS = 'id,titulo,descripcion,fecha,hora,responsable,deposito,estado,usuario,orden,created_at';

export interface ListResult {
  rows: Tarea[];
  live: boolean;
  /** null = la lectura salió bien. Con texto = hubo error y NO hay que mostrar
   *  "sin tareas": el operario podría volver a cargar algo que ya existe. */
  error: string | null;
}

/* ─────────────────────────── Lecturas ─────────────────────────── */
export async function listTareas(fromISO: string, toISO: string, deposito?: string): Promise<ListResult> {
  if (!isCalReady || !supabaseCal) {
    let rows = MOCK.filter((t) => t.fecha >= fromISO && t.fecha <= toISO);
    if (deposito) rows = rows.filter((t) => t.deposito === deposito);
    return { rows, live: false, error: null };
  }
  let q = supabaseCal.from('tareas').select(COLS).gte('fecha', fromISO).lte('fecha', toISO);
  if (deposito) q = q.eq('deposito', deposito);

  // Orden canónico: primero la fecha, después el orden manual dentro del día.
  // Antes `orden` iba primero y, como se asignaba 0..n por día, las tareas del
  // día 5 se entremezclaban con las del día 12 (ambas tenían orden 0,1,2).
  const { data, error } = await q
    .order('fecha')
    .order('orden', { nullsFirst: false })
    .order('hora', { nullsFirst: true })
    .order('id');

  if (error) {
    console.error('[calendario] listTareas', error);
    return { rows: [], live: true, error: error.message || 'No se pudieron cargar las tareas.' };
  }
  return { rows: (data ?? []) as Tarea[], live: true, error: null };
}

/* ─────────────────────────── Escrituras ─────────────────────────── */
export async function createTarea(input: NuevaTarea): Promise<Tarea> {
  if (!isCalReady || !supabaseCal) {
    const t: Tarea = { id: mockSeq++, created_at: new Date().toISOString(), descripcion: null, hora: null, responsable: null, deposito: null, usuario: null, orden: null, ...input } as Tarea;
    MOCK = [...MOCK, t];
    return t;
  }
  const { data, error } = await supabaseCal.from('tareas').insert(input).select(COLS).single();
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

/**
 * Reordena en UNA sola llamada. Antes se disparaba un PATCH por tarea
 * (18 tareas = 18 requests paralelos sobre datos móviles, todos los fallos
 * silenciados con `.catch(() => {})`).
 *
 * Usa la RPC `reorder_tareas` (ver db/calendario_orden_fix.sql). Si todavía no
 * está creada en Supabase, cae a los PATCH individuales para no romper nada,
 * pero ahora sí propaga el error.
 */
export async function reorderTareas(items: { id: number; orden: number }[]): Promise<void> {
  if (items.length === 0) return;
  const sb = supabaseCal;
  if (!isCalReady || !sb) {
    const byId = new Map(items.map((i) => [i.id, i.orden]));
    MOCK = MOCK.map((t) => (byId.has(t.id) ? { ...t, orden: byId.get(t.id)! } : t));
    return;
  }

  const { error } = await sb.rpc('reorder_tareas', {
    p_ids: items.map((i) => i.id),
    p_ordenes: items.map((i) => i.orden),
  });
  if (!error) return;

  // 42883 = la función no existe todavía en este proyecto Supabase.
  const missingRpc = error.code === '42883' || /function .*reorder_tareas/i.test(error.message ?? '');
  if (!missingRpc) throw error;

  console.warn('[calendario] reorder_tareas no está creada; usando PATCH por fila. Correr db/calendario_orden_fix.sql');
  const results = await Promise.allSettled(
    items.map((i) => sb.from('tareas').update({ orden: i.orden }).eq('id', i.id)),
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed) throw new Error(`No se pudo guardar el orden de ${failed} tarea(s).`);
}

/**
 * Escucha cambios en vivo. El schema ya publicaba la tabla en `supabase_realtime`
 * (db/calendario_schema.sql) pero nadie se suscribía: dos operarios con dos
 * teléfonos no se veían entre sí.
 *
 * Devuelve la función para cortar la suscripción.
 */
export function subscribeTareas(onChange: () => void): () => void {
  const sb = supabaseCal;
  if (!isCalReady || !sb) return () => {};
  const channel = sb
    .channel('tareas-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, onChange)
    .subscribe();
  return () => { void sb.removeChannel(channel); };
}
