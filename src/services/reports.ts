import { supabase } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mockData';
import type { Incident, IncidentReason, IncidentStatus } from '@/types';

export interface Bucket<K extends string> {
  key: K;
  count: number;
}
export interface MonthBucket {
  key: string;   // YYYY-MM
  label: string; // 'ago 25'
  count: number;
}
export interface SupplierStat {
  id: string;
  nombre: string;
  total: number;
  abiertas: number;
  terminadas: number;
}

export interface ReportData {
  live: boolean;
  total: number;
  terminadas: number;
  abiertas: number;
  resolutionRate: number; // 0..100
  byReason: Bucket<IncidentReason>[];
  byStatus: Bucket<IncidentStatus>[];
  byMonth: MonthBucket[];
  suppliers: SupplierStat[]; // todas, ordenadas por total desc
  rows: MinRow[]; // para exportar
}

interface MinRow {
  incident_number: string;
  supplier_nombre: string;
  reason: IncidentReason;
  status: IncidentStatus;
  created_at: string;
}

const OPEN = (s: IncidentStatus) => !['TERMINADO', 'ANULADO', 'RECHAZADO'].includes(s);

function monthsBack(n: number): MonthBucket[] {
  const out: MonthBucket[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-PY', { month: 'short', year: '2-digit' }),
      count: 0,
    });
  }
  return out;
}

function aggregate(rows: MinRow[], live: boolean): ReportData {
  const total = rows.length;
  const terminadas = rows.filter((r) => r.status === 'TERMINADO').length;
  const abiertas = rows.filter((r) => OPEN(r.status)).length;

  const reasonMap = new Map<IncidentReason, number>();
  const statusMap = new Map<IncidentStatus, number>();
  const months = monthsBack(12);
  const mIdx = new Map(months.map((m, i) => [m.key, i]));
  const supMap = new Map<string, SupplierStat>();

  for (const r of rows) {
    reasonMap.set(r.reason, (reasonMap.get(r.reason) ?? 0) + 1);
    statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
    const d = new Date(r.created_at);
    if (!Number.isNaN(d.getTime())) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const i = mIdx.get(k);
      if (i !== undefined) { const b = months[i]; if (b) b.count++; }
    }
    const name = r.supplier_nombre || '(sin proveedor)';
    const s = supMap.get(name) ?? { id: name, nombre: name, total: 0, abiertas: 0, terminadas: 0 };
    s.total++;
    if (r.status === 'TERMINADO') s.terminadas++;
    if (OPEN(r.status)) s.abiertas++;
    supMap.set(name, s);
  }

  const byReason = [...reasonMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
  const byStatus = [...statusMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
  const suppliers = [...supMap.values()].sort((a, b) => b.total - a.total);

  return {
    live,
    total,
    terminadas,
    abiertas,
    resolutionRate: total ? Math.round((terminadas / total) * 100) : 0,
    byReason,
    byStatus,
    byMonth: months,
    suppliers,
    rows,
  };
}

/** Reúne todas las incidencias (columnas mínimas) y las agrega para reportes. */
export async function getReportData(): Promise<ReportData> {
  if (supabase) {
    try {
      const rows: MinRow[] = [];
      const pageSize = 1000;
      for (let page = 0; page < 20; page++) {
        const from = page * pageSize;
        const { data, error } = await supabase
          .from('incidents')
          .select('incident_number,reason,status,created_at,supplier:suppliers(nombre)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const batch = data ?? [];
        for (const r of batch) {
          const rec = r as Record<string, unknown>;
          const sup = rec.supplier as { nombre?: string } | null;
          rows.push({
            incident_number: String(rec.incident_number ?? ''),
            supplier_nombre: sup?.nombre ?? '',
            reason: rec.reason as IncidentReason,
            status: rec.status as IncidentStatus,
            created_at: String(rec.created_at ?? ''),
          });
        }
        if (batch.length < pageSize) break;
      }
      return aggregate(rows, true);
    } catch (e) {
      console.warn('[reports] Supabase no disponible, usando mock:', (e as Error).message);
    }
  }
  const mock: MinRow[] = MOCK_INCIDENTS.filter((i: Incident) => !i.deleted_at).map((i) => ({
    incident_number: i.incident_number,
    supplier_nombre: i.supplier_nombre ?? '',
    reason: i.reason,
    status: i.status,
    created_at: i.created_at,
  }));
  return aggregate(mock, false);
}

/** Serializa filas a CSV (con BOM para Excel) y dispara la descarga. */
export function exportReportCsv(rows: MinRow[]): void {
  const header = ['N Incidencia', 'Proveedor', 'Motivo', 'Estado', 'Fecha'];
  const body = rows.map((r) => [
    r.incident_number,
    r.supplier_nombre,
    r.reason,
    r.status,
    r.created_at,
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `incidencias_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
