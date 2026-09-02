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

const SELECT =
  'id,incident_number,document_number,invoice_number,supplier_id,warehouse_id,reason,status,priority,description,created_by,assigned_to,emission_date,created_at,updated_at,verified_at,resolved_at,closed_at,deleted_at';

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
): Promise<ListResult> {
  if (supabase) {
    try {
      let query = supabase
        .from('incidents')
        .select(SELECT, { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

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
      return { rows: (data as Incident[]) ?? [], total: count ?? 0, live: true };
    } catch (err) {
      console.warn('[incidents] Supabase no disponible, usando mock:', (err as Error).message);
    }
  }

  const filtered = applyMockFilters(MOCK_INCIDENTS, filters);
  const start = (page - 1) * pageSize;
  return { rows: filtered.slice(start, start + pageSize), total: filtered.length, live: false };
}
