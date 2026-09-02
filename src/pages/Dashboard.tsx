import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  Plus, AlertTriangle, Clock, CheckCircle2, Timer, PackageX, PackagePlus, PackageMinus,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReasonBadge } from '@/components/ui/ReasonBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { MOCK_INCIDENTS } from '@/lib/mockData';
import { fmtAge, hoursSince } from '@/lib/utils';
import { SLA_THRESHOLDS } from '@/config/constants';

export function Dashboard() {
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);

  const inc = MOCK_INCIDENTS;
  const count = (fn: (i: (typeof inc)[number]) => boolean) => inc.filter(fn).length;

  const kpis = [
    { label: 'Pendientes', value: count((i) => i.status === 'PENDIENTE'), icon: Clock, accent: 'text-pendiente', foot: 'En cola', go: '/incidents/pending' },
    { label: 'Por vencer', value: count((i) => hoursSince(i.created_at) > SLA_THRESHOLDS.normalMax && !['TERMINADO', 'ANULADO'].includes(i.status)), icon: Timer, accent: 'text-averiado', foot: '> 24h abiertas' },
    { label: 'Vencidas', value: count((i) => hoursSince(i.created_at) > SLA_THRESHOLDS.highMax && !['TERMINADO', 'ANULADO'].includes(i.status)), icon: AlertTriangle, accent: 'text-critical', foot: '> 72h' },
    { label: 'Resueltas hoy', value: count((i) => i.status === 'TERMINADO'), icon: CheckCircle2, accent: 'text-terminado', foot: 'Este período' },
    { label: 'Sobrantes', value: count((i) => i.reason === 'SOBRANTE'), icon: PackagePlus, accent: 'text-sobrante', foot: 'Del período' },
    { label: 'Faltantes', value: count((i) => i.reason === 'FALTANTE'), icon: PackageMinus, accent: 'text-faltante', foot: 'Del período' },
    { label: 'Averiados', value: count((i) => i.reason === 'AVERIADO'), icon: PackageX, accent: 'text-averiado', foot: 'Del período' },
    { label: 'Total incidencias', value: inc.length, icon: AlertTriangle, accent: 'text-ink', foot: 'Histórico' },
  ];

  const attention = inc
    .filter((i) => !['TERMINADO', 'ANULADO'].includes(i.status))
    .sort((a, b) => hoursSince(b.created_at) - hoursSince(a.created_at))
    .slice(0, 4);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !gridRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.kpi-anim', {
        opacity: 0, y: 12, duration: 0.4, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity',
      });
    }, gridRef.current);
    return () => ctx.revert();
  }, []);

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Incidencias de Recepción"
        subtitle="Panel operativo · detectar, entender y resolver más rápido"
        actions={
          <button className="btn-primary" onClick={() => navigate('/incidents/new')}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva incidencia
          </button>
        }
      />

      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-anim">
            <KPICard
              label={k.label}
              value={k.value}
              icon={k.icon}
              accent={k.accent}
              foot={k.foot}
              onClick={k.go ? () => navigate(k.go!) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Requieren atención (sección 62) */}
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-averiado" />
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2">Requieren atención</h2>
        </div>
        <div className="card divide-y divide-border overflow-hidden">
          {attention.map((i) => (
            <button
              key={i.id}
              onClick={() => navigate(`/incidents/${i.incident_number}`)}
              className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-surface-3 transition-colors"
            >
              <span className="font-mono text-xs font-bold text-ink shrink-0 w-36">{i.incident_number}</span>
              <span className="text-sm font-semibold text-ink truncate flex-1">{i.supplier_nombre}</span>
              <ReasonBadge reason={i.reason} />
              <PriorityBadge priority={i.priority} />
              <span className="text-xs font-medium text-ink-3 w-20 text-right tabular-nums">
                {fmtAge(i.created_at)}
              </span>
              <StatusBadge status={i.status} />
            </button>
          ))}
          {attention.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-ink-3">
              Todas las incidencias están al día.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
