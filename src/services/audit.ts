import { supabase } from '@/lib/supabase';
import type { AuditAction, AuditLog } from '@/types';

export interface AuditFilters {
  action?: AuditAction;
  module?: string;
  search?: string; // usuario o registro
  from?: string;
  to?: string;
}

export interface AuditPage {
  rows: AuditLog[];
  total: number;
  live: boolean;
}

/** Lista el registro de auditoría con filtros y paginación server-side. */
export async function listAuditLogs(
  filters: AuditFilters = {},
  page = 1,
  pageSize = 50,
): Promise<AuditPage> {
  if (supabase) {
    try {
      let q = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.action) q = q.eq('action', filters.action);
      if (filters.module) q = q.eq('module', filters.module);
      if (filters.from) q = q.gte('created_at', filters.from);
      if (filters.to) q = q.lte('created_at', filters.to);
      if (filters.search) {
        const t = `%${filters.search}%`;
        q = q.or(`user_nombre.ilike.${t},record.ilike.${t}`);
      }

      const from = (page - 1) * pageSize;
      q = q.range(from, from + pageSize - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data as AuditLog[]) ?? [], total: count ?? 0, live: true };
    } catch (e) {
      console.warn('[audit] Supabase no disponible:', (e as Error).message);
    }
  }
  return { rows: [], total: 0, live: false };
}
