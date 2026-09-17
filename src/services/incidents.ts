import { supabase } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mockData';
import type { Incident, IncidentStatus, IncidentReason } from '@/types';

export interface IncidentFilters {
  status?: IncidentStatus | IncidentStatus[];
  reason?: IncidentReason;
  supplierId?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface ListResult {
  rows: Incident[];
  total: number;
  /** true si los datos vienen de Supabase; false si es el fallback mock. */
  live: boolean;
}

/**
 * Se lee de la vista `incidents_board`, no de la tabla `incidents`.
 *
 * Arregla dos cosas de una. Una: el proveedor viene PLANO, y eso es lo que
 * permite ordenar por proveedor del lado del servidor —con el embed
 * `supplier:suppliers(nombre)` no se podía, porque PostgREST ordena las filas
 * embebidas, no las del padre, así que el orden por proveedor terminaba
 * haciéndose en el cliente sobre la página actual nada más.
 *
 * Dos: trae items_count, affected_units y evidences_count. Las columnas
 * UNIDADES y FOTO de la tabla ya los mostraban, pero salían del mock: contra
 * datos reales quedaban vacías y no se notaba, porque se renderizan con
 * `?? '—'`.
 *
 * La vista no filtra por estado —sólo excluye borradas— así que sirve igual
 * para las seis pantallas por estado. Se instala con db/incidents_board.sql.
 */
const SELECT =
  'id,incident_number,document_number,invoice_number,supplier_id,supplier_nombre,' +
  'warehouse_id,reason,status,priority,description,created_by,created_by_nombre,' +
  'assigned_to,assigned_to_nombre,emission_date,created_at,updated_at,' +
  'verified_at,resolved_at,closed_at,items_count,affected_units,evidences_count';

/** Postgres devuelve numeric como string; la tabla necesita número. */
function mapRow(r: Record<string, unknown>): Incident {
  return {
    ...(r as unknown as Incident),
    items_count: Number(r.items_count ?? 0),
    affected_units: Number(r.affected_units ?? 0),
    evidences_count: Number(r.evidences_count ?? 0),
  };
}

/** Cómo se ordena. La clave la elige la UI al tocar el encabezado. */
export type SortKey = 'created_at' | 'supplier_nombre' | 'status' | 'age';
export interface Orden {
  key: SortKey;
  dir: 'asc' | 'desc';
}

function applyMockFilters(rows: Incident[], f: IncidentFilters): Incident[] {
  const statuses = f.status ? (Array.isArray(f.status) ? f.status : [f.status]) : null;
  const q = f.search?.trim().toLowerCase();
  return rows.filter((r) => {
    if (r.deleted_at) return false;
    if (statuses && !statuses.includes(r.status)) return false;
    if (f.reason && r.reason !== f.reason) return false;
    if (f.supplierId && r.supplier_id !== f.supplierId) return false;
    if (f.from && r.created_at < f.from) return false;
    if (f.to && r.created_at > f.to) return false;
    if (q) {
      const hay = `${r.incident_number} ${r.supplier_nombre ?? ''} ${r.invoice_number ?? ''} ${r.document_number ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Lista incidencias con paginación server-side. Usa Supabase cuando está
 * disponible; si las tablas aún no existen (o no hay config) cae a datos mock
 * para poder desarrollar la UI.
 */
export async function listIncidents(
  filters: IncidentFilters = {},
  page = 1,
  pageSize = 25,
  orden: Orden = { key: 'created_at', dir: 'desc' },
): Promise<ListResult> {
  if (supabase) {
    try {
      /* "Antigüedad" no es una columna: es cuánto hace que se creó. Ordenar
         por más antigua primero es ordenar por created_at ascendente, así que
         se traduce acá en vez de pedirle a Postgres una columna que no existe. */
      const columna = orden.key === 'age' ? 'created_at' : orden.key;
      const asc = orden.key === 'age' ? orden.dir === 'desc' : orden.dir === 'asc';

      let query = supabase
        .from('incidents_board')
        .select(SELECT, { count: 'exact' })
        // nullsFirst:false manda las incidencias sin proveedor al final en vez
        // de encabezar la tabla con un bloque de guiones.
        .order(columna, { ascending: asc, nullsFirst: false })
        // Desempate estable: sin esto, dos filas con el mismo proveedor pueden
        // cambiar de lugar entre páginas y una fila aparecer dos veces o ninguna.
        .order('incident_number', { ascending: false });

      if (filters.status) {
        const s = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', s);
      }
      if (filters.reason) query = query.eq('reason', filters.reason);
      if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
      if (filters.from) query = query.gte('created_at', filters.from);
      if (filters.to) query = query.lte('created_at', filters.to);
      if (filters.search) {
        const t = `%${filters.search}%`;
        query = query.or(
          `incident_number.ilike.${t},invoice_number.ilike.${t},document_number.ilike.${t}`,
        );
      }

      const fromIdx = (page - 1) * pageSize;
      query = query.range(fromIdx, fromIdx + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []).map((r) => mapRow(r as unknown as Record<string, unknown>)), total: count ?? 0, live: true };
    } catch (err) {
      console.warn('[incidents] Supabase no disponible, usando mock:', (err as Error).message);
    }
  }

  /* El mock ordena con las MISMAS reglas que la consulta. Si no, probar sin
     conexión daría la impresión de que los encabezados no responden. */
  const filtered = ordenarMock(applyMockFilters(MOCK_INCIDENTS, filters), orden);
  const start = (page - 1) * pageSize;
  return { rows: filtered.slice(start, start + pageSize), total: filtered.length, live: false };
}

function ordenarMock(rows: Incident[], orden: Orden): Incident[] {
  const dir = orden.dir === 'asc' ? 1 : -1;
  const valor = (r: Incident): string | number =>
    orden.key === 'supplier_nombre' ? (r.supplier_nombre ?? '￿') // sin proveedor, al final
    : orden.key === 'status'         ? r.status
    : new Date(r.created_at).getTime();
  // "age" es created_at al revés: más antigua = creada antes.
  const signo = orden.key === 'age' ? -dir : dir;
  return [...rows].sort((a, b) => {
    const av = valor(a), bv = valor(b);
    return av < bv ? -signo : av > bv ? signo : 0;
  });
}

export interface NewIncidentItem {
  product_id?: string | null;
  codigo: string;
  descripcion: string;
  expected_qty?: number;
  received_qty?: number;
  affected_qty?: number;
  difference_qty?: number;
  unit?: string;
  lot?: string | null;
  observation?: string | null;
}

export interface NewIncidentPayload {
  document_number?: string | null;
  invoice_number?: string | null;
  supplier_id?: string | null;
  warehouse_id?: string | null;
  reason: IncidentReason;
  priority?: string;
  description?: string | null;
  emission_date?: string;
  status?: 'PENDIENTE' | 'BORRADOR';
  items: NewIncidentItem[];
}

/** Crea una incidencia vía RPC atómica (valida permiso + historial + auditoría). */
export async function createIncident(actorId: string, payload: NewIncidentPayload): Promise<Incident> {
  if (!supabase) {
    throw new Error('Sin conexión a Supabase. Configurá .env.local y corré db/schema.sql.');
  }
  const { data, error } = await supabase.rpc('create_incident', {
    p_actor: actorId,
    p_payload: payload,
  });
  if (error) throw new Error(error.message);
  return data as Incident;
}
