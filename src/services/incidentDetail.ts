import { supabase } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mockData';
import type {
  Incident, IncidentItem, StatusHistoryEntry, IncidentComment, IncidentEvidence, AuditLog,
} from '@/types';

// `listUsers` vive ahora en el servicio de usuarios; se reexporta para no romper imports.
export { listUsers } from './users';

export interface IncidentDetail {
  incident: Incident;
  items: IncidentItem[];
  history: StatusHistoryEntry[];
  comments: IncidentComment[];
  evidences: IncidentEvidence[];
  audit: AuditLog[];
  live: boolean;
}

function mockDetail(numberOrId: string): IncidentDetail | null {
  const inc = MOCK_INCIDENTS.find((i) => i.incident_number === numberOrId || i.id === numberOrId);
  if (!inc) return null;
  return { incident: inc, items: [], history: [], comments: [], evidences: [], audit: [], live: false };
}

export async function getIncident(incidentNumber: string): Promise<IncidentDetail | null> {
  if (!supabase) return mockDetail(incidentNumber);
  try {
    const { data: inc, error } = await supabase
      .from('incidents')
      .select(
        'id,incident_number,document_number,invoice_number,supplier_id,warehouse_id,reason,status,priority,description,created_by,assigned_to,emission_date,created_at,updated_at,verified_at,resolved_at,closed_at,deleted_at,delete_reason,supplier:suppliers(nombre),creador:users!incidents_created_by_fkey(nombre),responsable:users!incidents_assigned_to_fkey(nombre)',
      )
      .eq('incident_number', incidentNumber)
      .maybeSingle();
    if (error) throw error;
    if (!inc) return null;

    const id = (inc as { id: string }).id;
    const [items, history, comments, evidences, audit] = await Promise.all([
      supabase.from('incident_items').select('*').eq('incident_id', id).order('created_at'),
      supabase
        .from('incident_status_history')
        .select('*,user:users(nombre)')
        .eq('incident_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('incident_comments')
        .select('*,user:users(nombre)')
        .eq('incident_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('incident_evidences').select('*,user:users!incident_evidences_uploaded_by_fkey(nombre)').eq('incident_id', id).order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').eq('incident_id', id).order('created_at', { ascending: false }).limit(100),
    ]);

    const r = inc as Record<string, unknown>;
    const supplier = r.supplier as { nombre?: string } | null;
    const creador = r.creador as { nombre?: string } | null;
    const responsable = r.responsable as { nombre?: string } | null;
    const incident: Incident = {
      ...(r as unknown as Incident),
      supplier_nombre: supplier?.nombre ?? null,
      created_by_nombre: creador?.nombre ?? null,
      assigned_to_nombre: responsable?.nombre ?? null,
    };

    const mapUser = (rows: unknown[] | null, key = 'user') =>
      (rows ?? []).map((x) => {
        const o = x as Record<string, unknown>;
        const u = o[key] as { nombre?: string } | null;
        return { ...o, user_nombre: u?.nombre ?? '—' };
      });

    return {
      incident,
      items: (items.data as IncidentItem[]) ?? [],
      history: mapUser(history.data) as unknown as StatusHistoryEntry[],
      comments: mapUser(comments.data) as unknown as IncidentComment[],
      evidences: mapUser(evidences.data) as unknown as IncidentEvidence[],
      audit: (audit.data as AuditLog[]) ?? [],
      live: true,
    };
  } catch (e) {
    console.warn('[detail] fallback mock:', (e as Error).message);
    return mockDetail(incidentNumber);
  }
}


// ── Acciones de workflow (RPC) ──────────────────────────────────────────────
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Sin conexión a Supabase.');
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const verifyIncident = (actor: string, id: string, result: string, comment: string) =>
  rpc<Incident>('verify_incident', { p_actor: actor, p_incident: id, p_result: result, p_comment: comment });

export const resolveIncident = (actor: string, id: string, type: string, observation: string) =>
  rpc<Incident>('resolve_incident', { p_actor: actor, p_incident: id, p_type: type, p_observation: observation });

export const closeIncident = (actor: string, id: string, comment: string) =>
  rpc<Incident>('close_incident', { p_actor: actor, p_incident: id, p_comment: comment });

export const reopenIncident = (actor: string, id: string, comment: string) =>
  rpc<Incident>('reopen_incident', { p_actor: actor, p_incident: id, p_comment: comment });

export const anularIncident = (actor: string, id: string, reason: string) =>
  rpc<Incident>('anular_incident', { p_actor: actor, p_incident: id, p_reason: reason });

export const assignIncident = (actor: string, id: string, assignee: string) =>
  rpc<Incident>('assign_incident', { p_actor: actor, p_incident: id, p_assignee: assignee });

export const addComment = (actor: string, id: string, body: string) =>
  rpc<IncidentComment>('add_comment', { p_actor: actor, p_incident: id, p_body: body });
