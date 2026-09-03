import { supabase } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mockData';
import { SLA_THRESHOLDS } from '@/config/constants';
import { hoursSince } from '@/lib/utils';
import type { Incident } from '@/types';

export interface DashboardKpis {
  pendientes: number;
  porVencer: number;
  vencidas: number;
  resueltasHoy: number;
  sobrantes: number;
  faltantes: number;
  averiados: number;
  total: number;
}

export interface MonthlyPoint {
  key: string;   // 'YYYY-MM'
  label: string; // 'ago 25'
  total: number;
}

export interface DashboardStats {
  live: boolean;
  kpis: DashboardKpis;
  attention: Incident[];
  monthly: MonthlyPoint[];
}

const OPEN_NOT_IN = '(TERMINADO,ANULADO)';

const ATTENTION_SELECT =
  'id,incident_number,supplier_id,reason,status,priority,created_at,supplier:suppliers(nombre)';

function isoHoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}
function isoStartOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Construye los últimos 12 meses (incluye el actual) como buckets vacíos. */
function emptyMonths(): MonthlyPoint[] {
  const out: MonthlyPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-PY', { month: 'short', year: '2-digit' });
    out.push({ key, label, total: 0 });
  }
  return out;
}

function bucketMonthly(dates: string[]): MonthlyPoint[] {
  const months = emptyMonths();
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const iso of dates) {
    if (!iso) continue;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const i = idx.get(key);
    if (i === undefined) continue;
    const m = months[i];
    if (m) m.total++;
  }
  return months;
}

async function count(q: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
}

function base() {
  return supabase!.from('incidents').select('*', { count: 'exact', head: true }).is('deleted_at', null);
}

/** Estadísticas del panel operativo. Usa Supabase; cae a mock si no hay datos. */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (supabase) {
    try {
      const cut24 = isoHoursAgo(SLA_THRESHOLDS.normalMax);
      const cut72 = isoHoursAgo(SLA_THRESHOLDS.highMax);
      const today = isoStartOfToday();

      const [
        total, pendientes, sobrantes, faltantes, averiados, resueltasHoy, porVencer, vencidas,
        attentionRes, monthlyRes,
      ] = await Promise.all([
        count(base()),
        count(base().eq('status', 'PENDIENTE')),
        count(base().eq('reason', 'SOBRANTE')),
        count(base().eq('reason', 'FALTANTE')),
        count(base().eq('reason', 'AVERIADO')),
        count(base().eq('status', 'TERMINADO').gte('closed_at', today)),
        count(base().not('status', 'in', OPEN_NOT_IN).lte('created_at', cut24)),
        count(base().not('status', 'in', OPEN_NOT_IN).lte('created_at', cut72)),
        supabase
          .from('incidents')
          .select(ATTENTION_SELECT)
          .is('deleted_at', null)
          .not('status', 'in', OPEN_NOT_IN)
          .order('created_at', { ascending: true })
          .limit(6),
        supabase
          .from('incidents')
          .select('created_at')
          .is('deleted_at', null)
          .gte('created_at', isoHoursAgo(24 * 365))
          .order('created_at', { ascending: true })
          .limit(5000),
      ]);

      if (attentionRes.error) throw attentionRes.error;
      if (monthlyRes.error) throw monthlyRes.error;

      const attention = (attentionRes.data ?? []).map((r) => {
        const rec = r as Record<string, unknown>;
        const sup = rec.supplier as { nombre?: string } | null;
        return { ...(rec as unknown as Incident), supplier_nombre: sup?.nombre ?? null };
      });
      const monthly = bucketMonthly((monthlyRes.data ?? []).map((r) => (r as { created_at: string }).created_at));

      return {
        live: true,
        kpis: { pendientes, porVencer, vencidas, resueltasHoy, sobrantes, faltantes, averiados, total },
        attention,
        monthly,
      };
    } catch (err) {
      console.warn('[dashboard] Supabase no disponible, usando mock:', (err as Error).message);
    }
  }
  return mockStats();
}

function mockStats(): DashboardStats {
  const inc = MOCK_INCIDENTS.filter((i) => !i.deleted_at);
  const open = (i: Incident) => !['TERMINADO', 'ANULADO'].includes(i.status);
  const c = (fn: (i: Incident) => boolean) => inc.filter(fn).length;
  return {
    live: false,
    kpis: {
      pendientes: c((i) => i.status === 'PENDIENTE'),
      porVencer: c((i) => open(i) && hoursSince(i.created_at) > SLA_THRESHOLDS.normalMax),
      vencidas: c((i) => open(i) && hoursSince(i.created_at) > SLA_THRESHOLDS.highMax),
      resueltasHoy: c((i) => i.status === 'TERMINADO'),
      sobrantes: c((i) => i.reason === 'SOBRANTE'),
      faltantes: c((i) => i.reason === 'FALTANTE'),
      averiados: c((i) => i.reason === 'AVERIADO'),
      total: inc.length,
    },
    attention: inc
      .filter(open)
      .sort((a, b) => hoursSince(b.created_at) - hoursSince(a.created_at))
      .slice(0, 6),
    monthly: bucketMonthly(inc.map((i) => i.created_at)),
  };
}
