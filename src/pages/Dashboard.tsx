import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  Plus, AlertTriangle, Clock, CheckCircle2, Timer, PackageX, PackagePlus, PackageMinus, BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReasonBadge } from '@/components/ui/ReasonBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { MonthlyBars } from '@/components/MonthlyBars';
import { getDashboardStats, type DashboardStats } from '@/services/dashboard';
import { fmtAge } from '@/lib/utils';

export function Dashboard() {
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let alive = true;
    getDashboardStats()
      .then((s) => { if (alive) setStats(s); })
      .catch((e) => console.error('[dashboard]', e));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!stats) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !gridRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.kpi-anim', {
        opacity: 0, y: 12, duration: 0.4, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity',
      });
    }, gridRef.current);
    return () => ctx.revert();
  }, [stats]);

  const k = stats?.kpis;
  const kpis = [
    { label: 'Pendientes', value: k?.pendientes ?? 0, icon: Clock, accent: 'text-pendiente', foot: 'En cola', go: '/incidents/pending' },
    { label: 'Por vencer', value: k?.porVencer ?? 0, icon: Timer, accent: 'text-averiado', foot: '> 24h abiertas' },
    { label: 'Vencidas', value: k?.vencidas ?? 0, icon: AlertTriangle, accent: 'text-critical', foot: '> 72h' },
    { label: 'Resueltas hoy', value: k?.resueltasHoy ?? 0, icon: CheckCircle2, accent: 'text-terminado', foot: 'Cerradas hoy' },
    { label: 'Sobrantes', value: k?.sobrantes ?? 0, icon: PackagePlus, accent: 'text-sobrante', foot: 'Histórico' },
    { label: 'Faltantes', value: k?.faltantes ?? 0, icon: PackageMinus, accent: 'text-faltante', foot: 'Histórico' },
    { label: 'Averiados', value: k?.averiados ?? 0, icon: PackageX, accent: 'text-averiado', foot: 'Histórico' },
    { label: 'Total incidencias', value: k?.total ?? 0, icon: BarChart3, accent: 'text-ink', foot: 'Histórico' },
  ];

  const loading = !stats;
  const attention = stats?.attention ?? [];

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Incidencias de Recepción"
        subtitle="Panel operativo · detectar, entender y resolver más rápido"
        actions={
          <div className="flex items-center gap-3">
            {stats && (
              <span
                className={
                  stats.live
                    ? 'inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-terminado'
                    : 'inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-ink-3'
                }
              >
                <span className={stats.live ? 'h-2 w-2 rounded-full bg-terminado' : 'h-2 w-2 rounded-full bg-ink-3'} />
                {stats.live ? 'Datos en vivo' : 'Modo demo'}
              </span>
            )}
            <button className="btn-primary" onClick={() => navigate('/incidents/new')}>
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva incidencia
            </button>
          </div>
        }
      />

      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-4 h-[104px] animate-pulse">
                <div className="h-3 w-16 rounded bg-surface-3" />
                <div className="mt-3 h-8 w-12 rounded bg-surface-3" />
                <div className="mt-3 h-3 w-20 rounded bg-surface-3" />
              </div>
            ))
          : kpis.map((kpi) => (
              <div key={kpi.label} className="kpi-anim">
                <KPICard
                  label={kpi.label}
                  value={kpi.value}
                  icon={kpi.icon}
                  accent={kpi.accent}
                  foot={kpi.foot}
                  onClick={kpi.go ? () => navigate(kpi.go!) : undefined}
                />
              </div>
            ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia mensual */}
        <section className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2">Incidencias por mes</h2>
          </div>
          {loading ? (
            <div className="h-44 rounded bg-surface-3 animate-pulse" />
          ) : (
            <MonthlyBars data={stats!.monthly} />
          )}
        </section>

        {/* Requieren atención (sección 62) */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-averiado" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2">Requieren atención</h2>
          </div>
          <div className="card divide-y divide-border overflow-hidden">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3.5 flex items-center gap-3 animate-pulse">
                  <div className="h-3 w-28 rounded bg-surface-3" />
                  <div className="h-3 flex-1 rounded bg-surface-3" />
                  <div className="h-4 w-16 rounded bg-surface-3" />
                </div>
              ))
            ) : attention.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-3">
                Todas las incidencias están al día.
              </div>
            ) : (
              attention.map((i) => (
                <button
                  key={i.id}
                  onClick={() => navigate(`/incidents/${i.incident_number}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-3 transition-colors"
                >
                  <span className="font-mono text-xs font-bold text-ink shrink-0 w-32">{i.incident_number}</span>
                  <span className="text-sm font-semibold text-ink truncate flex-1">{i.supplier_nombre ?? '—'}</span>
                  <ReasonBadge reason={i.reason} />
                  <PriorityBadge priority={i.priority} />
                  <span className="text-xs font-medium text-ink-3 w-16 text-right tabular-nums">
                    {fmtAge(i.created_at)}
                  </span>
                  <StatusBadge status={i.status} />
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
