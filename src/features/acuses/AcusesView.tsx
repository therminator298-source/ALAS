import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  FileText, Search, Plus, Clock, Truck, CheckCircle2, Ban, CalendarClock, Users, Download,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { listAcuses, getAcuseDashboard, downloadAcusesCsv } from './acuseApi';
import { AcuseFormModal } from './AcuseFormModal';
import { AcuseDetailModal } from './AcuseDetailModal';
import { ACUSE_ESTADOS, estadoKey, type AcuseRow, type AcuseDashboard, type AcuseEstado } from './types';

const ESTADO_STYLE: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  en_reparto: 'bg-blue-100 text-blue-700',
  entregado: 'bg-emerald-100 text-emerald-700',
  anulado: 'bg-slate-200 text-slate-500',
};
const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', en_reparto: 'En Reparto', entregado: 'Entregado', anulado: 'Anulado',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function EstadoChip({ estado }: { estado: string }) {
  const k = estadoKey(estado);
  return <span className={cn('chip h-6 px-2.5 text-2xs font-bold', ESTADO_STYLE[k])}>{ESTADO_LABEL[k]}</span>;
}

export function AcusesView() {
  const [dash, setDash] = useState<AcuseDashboard | null>(null);
  const [rows, setRows] = useState<AcuseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [estado, setEstado] = useState<'all' | AcuseEstado>('all');
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formId, setFormId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => { getAcuseDashboard().then(setDash); }, [reloadKey]);
  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listAcuses({ estado, search: debounced || undefined }).then((res) => {
      if (!alive) return;
      setRows(res.rows); setTotal(res.total); setLive(res.live); setLoading(false);
    });
    return () => { alive = false; };
  }, [estado, debounced, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);
  const openNuevo = () => { setFormId(null); setFormOpen(true); };
  const openEditar = (id: number) => { setDetailId(null); setFormId(id); setFormOpen(true); };

  async function exportCsv() {
    setExporting(true);
    try {
      const n = await downloadAcusesCsv({ estado, search: debounced || undefined });
      toast(`${n} acuses exportados a CSV.`, 'ok');
    } catch (e) {
      toast((e as Error).message || 'No se pudo exportar.', 'err');
    } finally { setExporting(false); }
  }

  useEffect(() => {
    if (!rootRef.current) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from('.acuse-kpi', { opacity: 0, y: 12, scale: 0.97, duration: 0.4, stagger: 0.05, ease: 'back.out(1.5)', clearProps: 'all' });
    }, rootRef.current);
    return () => ctx.revert();
  }, [dash]);

  useEffect(() => {
    if (loading || !tbodyRef.current) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from('tr[data-row]', { opacity: 0, y: 6, duration: 0.28, stagger: 0.015, ease: 'power2.out', clearProps: 'transform,opacity' });
    }, tbodyRef.current);
    return () => ctx.revert();
  }, [loading, rows]);

  const kpis = useMemo(() => ([
    { label: 'Total', value: dash?.total ?? 0, icon: FileText, color: 'text-brand' },
    { label: 'Pendientes', value: dash?.pendientes ?? 0, icon: Clock, color: 'text-amber-600' },
    { label: 'En Reparto', value: dash?.enReparto ?? 0, icon: Truck, color: 'text-blue-600' },
    { label: 'Entregados', value: dash?.entregados ?? 0, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Anulados', value: dash?.anulados ?? 0, icon: Ban, color: 'text-slate-500' },
    { label: 'Hoy', value: dash?.hoy ?? 0, icon: CalendarClock, color: 'text-brand' },
  ]), [dash]);

  return (
    <div ref={rootRef} className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Acuses"
        subtitle="Gestión de acuses de recibo · panel operativo"
        actions={
          <>
            <button className="btn-secondary" onClick={exportCsv} disabled={exporting}>
              <Download className="h-4 w-4" /> {exporting ? 'Exportando…' : 'Exportar CSV'}
            </button>
            <button className="btn-primary" onClick={openNuevo}>
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Nuevo acuse
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="acuse-kpi card p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wide text-ink-3">{k.label}</span>
                <Icon className={cn('h-4 w-4', k.color)} />
              </div>
              <div className={cn('mt-1 text-2xl font-extrabold tabular-nums', k.color)}>{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por N° de acuse, cliente o repartidor…" className="input pl-9" />
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setEstado('all')} className={cn('chip h-8 px-3 border transition-colors', estado === 'all' ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-border hover:border-border-strong')}>Todos</button>
          {ACUSE_ESTADOS.map((e) => (
            <button key={e} onClick={() => setEstado((c) => (c === e ? 'all' : e))} className={cn('chip h-8 px-3 border transition-colors', estado === e ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-border hover:border-border-strong')}>{e}</button>
          ))}
        </div>
        <span className="ml-auto text-sm font-semibold text-ink-3 tabular-nums">{total} resultado{total === 1 ? '' : 's'}</span>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-3 border-b border-border text-left">
                <Th>N° Acuse</Th><Th>Cliente</Th><Th>Ciudad / Zona</Th><Th>Emisión</Th>
                <Th>Entrega</Th><Th>Repartidor</Th><Th className="text-right">Ítems</Th>
                <Th className="text-right">Unid.</Th><Th>Estado</Th>
              </tr>
            </thead>
            <tbody ref={tbodyRef} className="divide-y divide-border">
              {!loading && rows.map((a) => (
                <tr key={a.id} data-row onClick={() => setDetailId(a.id)} className="h-[52px] hover:bg-surface-3 cursor-pointer transition-colors">
                  <td className="px-4 font-mono text-xs font-bold text-ink whitespace-nowrap">{a.nro_acuse}</td>
                  <td className="px-4 font-semibold text-ink max-w-[240px] truncate">{a.cliente_nombre ?? a.cod_cliente ?? '—'}</td>
                  <td className="px-4 text-ink-2 whitespace-nowrap">{a.cliente_ciudad ?? a.zona ?? '—'}</td>
                  <td className="px-4 text-ink-2 whitespace-nowrap">{fmtDate(a.fecha_emision)}</td>
                  <td className="px-4 text-ink-2 whitespace-nowrap">{fmtDate(a.fecha_entrega)}</td>
                  <td className="px-4 text-ink-2 max-w-[180px] truncate">{a.repartidor_nombre ?? '—'}</td>
                  <td className="px-4 text-right tabular-nums">{a.items}</td>
                  <td className="px-4 text-right font-mono font-semibold tabular-nums">{a.unidades}</td>
                  <td className="px-4"><EstadoChip estado={a.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <SkeletonTable rows={8} cols={9} />}
        {!loading && rows.length === 0 && (
          <EmptyState icon={FileText} title="No hay acuses" message="Cuando se registren acuses aparecerán aquí." />
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-2xs font-semibold text-ink-3 inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {live ? `Datos en vivo · Supabase · ${dash?.repartidores ?? 0} repartidores` : 'Vista previa · datos de ejemplo (creá el Supabase de Acuses y corré acuse_schema.sql)'}
        </span>
      </div>

      <AcuseFormModal
        open={formOpen}
        acuseId={formId}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); reload(); }}
      />
      <AcuseDetailModal
        open={detailId != null}
        acuseId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={reload}
        onEdit={openEditar}
      />
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 whitespace-nowrap', className)}>{children}</th>;
}
