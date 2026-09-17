import { supabase } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mockData';
import type { Incident, IncidentReason, IncidentStatus } from '@/types';

/**
 * Incidencia con lo que la tarjeta del tablero necesita y la tabla `incidents`
 * no tiene: proveedor, unidades sumadas, cantidad de evidencias y la URL de la
 * primera foto. Todo eso lo calcula la vista `incidents_board` (db/incidents_board.sql).
 */
export interface BoardIncident extends Incident {
  first_photo_url?: string | null;
}

/**
 * Las cinco columnas, en el orden en que avanza el flujo.
 *
 * `dot` va con la clase entera escrita y no como `bg-${token}`: Tailwind lee
 * el código fuente como texto para decidir qué CSS generar, así que una clase
 * armada por concatenación nunca llega a existir y el punto sale sin color.
 */
export const BOARD_COLUMNS = [
  { status: 'PENDIENTE',     label: 'Pendientes',  dot: 'bg-pendiente' },
  { status: 'EN_REVISION',   label: 'En revisión', dot: 'bg-revision' },
  { status: 'VERIFICADO',    label: 'Verificados', dot: 'bg-brand' },
  { status: 'EN_RESOLUCION', label: 'Reclamados',  dot: 'bg-averiado' },
  { status: 'TERMINADO',     label: 'Terminados',  dot: 'bg-terminado' },
] as const satisfies ReadonlyArray<{ status: IncidentStatus; label: string; dot: string }>;

export type BoardStatus = (typeof BOARD_COLUMNS)[number]['status'];

export const BOARD_STATUSES: BoardStatus[] = BOARD_COLUMNS.map((c) => c.status);

/**
 * Por qué el resultado dice de dónde salieron los datos.
 *
 * El servicio viejo (services/incidents.ts) atrapa CUALQUIER error de Supabase
 * y cae a datos inventados con un console.warn que nadie ve. No distingue "no
 * hay tablas" —para lo que se escribió— de "RLS me rechazó", "se cayó la red"
 * o "expiró la sesión". En un depósito eso es peligroso: alguien abre el
 * tablero con mala señal y actúa sobre incidencias que no existen.
 *
 * Acá el motivo viaja hasta la UI para que el cartel diga qué pasó de verdad,
 * en vez de un "vista previa" que sirve igual para las cuatro causas.
 */
export type BoardSource =
  | { kind: 'live' }
  | { kind: 'sin-config' }
  | { kind: 'sin-vista'; detail: string }
  | { kind: 'error'; detail: string };

/** Las variantes que NO son datos reales. La UI recibe sólo estas. */
export type BoardFallback = Exclude<BoardSource, { kind: 'live' }>;

export interface BoardResult {
  rows: BoardIncident[];
  source: BoardSource;
}

const SELECT =
  'id,incident_number,document_number,invoice_number,supplier_id,supplier_nombre,' +
  'warehouse_id,reason,status,priority,description,created_by,created_by_nombre,' +
  'assigned_to,assigned_to_nombre,emission_date,created_at,updated_at,' +
  'verified_at,resolved_at,closed_at,items_count,affected_units,evidences_count,first_photo_url';

/** Postgres devuelve numeric como string; la tarjeta necesita número. */
function normalizar(r: Record<string, unknown>): BoardIncident {
  return {
    ...(r as unknown as BoardIncident),
    affected_units: Number(r.affected_units ?? 0),
    items_count: Number(r.items_count ?? 0),
    evidences_count: Number(r.evidences_count ?? 0),
  };
}

/**
 * Trae de una sola vez las incidencias de las cinco columnas.
 *
 * Una consulta y no cinco: el tablero muestra todas las columnas a la vez, así
 * que pedirlas por separado serían cinco viajes para pintar una pantalla. Se
 * reparten por estado del lado del cliente, que es gratis.
 *
 * `limite` es por las dudas, no por diseño: sin techo, un año de incidencias
 * terminadas entraría entero en memoria para llenar una columna que casi nadie
 * mira hasta el fondo.
 */
export async function listBoard(
  reason: IncidentReason | null = null,
  limite = 300,
): Promise<BoardResult> {
  if (!supabase) {
    return { rows: mock(reason), source: { kind: 'sin-config' } };
  }

  let query = supabase
    .from('incidents_board')
    .select(SELECT)
    .in('status', BOARD_STATUSES)
    // Las más nuevas primero: es el orden en que se van registrando, y es el
    // que pidió quien usa esto. El tablero no reordena después.
    .order('created_at', { ascending: false })
    .limit(limite);

  if (reason) query = query.eq('reason', reason);

  const { data, error } = await query;

  if (error) {
    // 42P01 = la relación no existe. Es el único caso en que "todavía no
    // corriste el SQL" es la explicación correcta, y merece un cartel que lo
    // diga con esas palabras en vez de un error genérico.
    const falta = error.code === '42P01' || /incidents_board/i.test(error.message);
    return {
      rows: mock(reason),
      source: falta
        ? { kind: 'sin-vista', detail: error.message }
        : { kind: 'error', detail: error.message },
    };
  }

  return {
    rows: (data ?? []).map((r) => normalizar(r as unknown as Record<string, unknown>)),
    source: { kind: 'live' },
  };
}

/** Los datos de ejemplo, filtrados igual que los reales. */
function mock(reason: IncidentReason | null): BoardIncident[] {
  return MOCK_INCIDENTS.filter(
    (r) =>
      !r.deleted_at &&
      BOARD_STATUSES.includes(r.status as BoardStatus) &&
      (!reason || r.reason === reason),
  ).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/**
 * Mueve una incidencia de estado.
 *
 * Usa `incident_change_status`, la RPC genérica de schema.sql: valida el
 * permiso del actor, escribe la fila en incident_status_history y deja el
 * registro en audit_logs. Es la misma maquinaria que usan verify/resolve/close,
 * y existe para los saltos que no tienen una RPC con nombre propio —entrar a
 * "En revisión", o volver atrás desde ahí.
 *
 * Ojo con lo que NO hace: no comprueba que la transición sea legal. Le pasás
 * un estado y lo escribe. Quien llame tiene que filtrar antes contra
 * STATUS_TRANSITIONS, o se puede saltear la verificación entera.
 */
export async function cambiarEstadoBoard(
  actorId: string,
  incidentId: string,
  hasta: IncidentStatus,
  comentario?: string,
): Promise<void> {
  if (!supabase) throw new Error('Sin conexión a Supabase.');
  const { error } = await supabase.rpc('incident_change_status', {
    p_actor: actorId,
    p_incident: incidentId,
    p_to: hasta,
    p_comment: comentario?.trim() || null,
  });
  if (error) throw new Error(error.message);
}

/** Reparte las filas en las cinco columnas, conservando el orden de llegada. */
export function agruparPorColumna(rows: BoardIncident[]): Record<BoardStatus, BoardIncident[]> {
  const out = Object.fromEntries(BOARD_STATUSES.map((s) => [s, [] as BoardIncident[]])) as Record<
    BoardStatus,
    BoardIncident[]
  >;
  for (const r of rows) {
    const col = out[r.status as BoardStatus];
    if (col) col.push(r);
  }
  return out;
}
