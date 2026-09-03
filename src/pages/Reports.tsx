import { useEffect, useState } from 'react';
import { Download, TrendingUp, CheckCircle2, FolderOpen, Layers } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { CategoryBars } from '@/components/CategoryBars';
import { MonthlyBars } from '@/components/MonthlyBars';
import { getReportData, exportReportCsv, type ReportData } from '@/services/reports';
import { REASON_LABELS, REASON_STYLES, STATUS_LABELS, STATUS_STYLES } from '@/config/constants';

export function Reports() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    let alive = true;
    getReportData().then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);

  const loading = !data;
  const topReason = data?.byReason[0];

  const reasonRows = (data?.byReason ?? []).map((b) => ({
    label: REASON_LABELS[b.key],
    value: b.count,
    color: REASON_STYLES[b.key]?.dot ?? 'bg-ink-3',
  }));
  const statusRows = (data?.byStatus ?? []).map((b) => ({
    label: STATUS_LABELS[b.key],
    value: b.count,
    color: STATUS_STYLES[b.key]?.dot ?? 'bg-ink-3',
  }));
  const monthly = (data?.byMonth ?? []).map((m) => ({ key: m.key, label: m.label, total: m.count }));
  const topSuppliers = (data?.suppliers ?? []).slice(0, 8);

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Reportes"
        subtitle="Análisis de incidencias de recepción"
        actions={
          <button
            className="btn-secondary"
            disabled={loading || !data?.rows.length}
            onClick={() => data && exportReportCsv(data.rows)}
          >
            <Download className="h-4 w-4" strokeWidth={2.5} /> Exportar CSV
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-[104px] animate-pulse">
              <div className="h-3 w-16 rounded bg-surface-3" />
              <div className="mt-3 h-8 w-12 rounded bg-surface-3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KPICard label="Total incidencias" value={data!.total} icon={Layers} foot="Histórico" />
            <KPICard label="Tasa de resolución" value={`${data!.resolutionRate}%`} icon={CheckCircle2} accent="text-terminado" foot={`${data!.terminadas} terminadas`} />
            <KPICard label="Abiertas" value={data!.abiertas} icon={FolderOpen} accent="text-averiado" foot="En proceso" />
            <KPICard label="Motivo más común" value={topReason ? topReason.count : 0} icon={TrendingUp} accent="text-brand" foot={topReason ? REASON_LABELS[topReason.key] : '—'} />
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="card p-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2 mb-4">Por motivo</h2>
              <CategoryBars data={reasonRows} />
            </section>
            <section className="card p-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2 mb-4">Por estado</h2>
              <CategoryBars data={statusRows} />
            </section>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="card p-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2 mb-4">Tendencia mensual</h2>
              <MonthlyBars data={monthly} />
            </section>
            <section className="card p-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2 mb-4">Top proveedores</h2>
              {topSuppliers.length === 0 ? (
                <p className="text-sm text-ink-3 py-6 text-center">Sin datos.</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {topSuppliers.map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-3 py-2">
                      <span className="w-5 text-center font-mono text-xs font-bold text-ink-3">{idx + 1}</span>
                      <span className="flex-1 text-sm font-semibold text-ink truncate" title={s.nombre}>{s.nombre}</span>
                      <span className="text-2xs text-averiado tabular-nums">{s.abiertas} ab.</span>
                      <span className="font-mono text-sm font-bold text-ink tabular-nums w-8 text-right">{s.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <p className="mt-3 text-2xs font-semibold text-ink-3">
            {data!.live ? 'Datos en vivo · Supabase' : 'Vista previa · datos de ejemplo'}
          </p>
        </>
      )}
    </div>
  );
}
