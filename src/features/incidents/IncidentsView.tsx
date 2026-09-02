import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReasonBadge } from '@/components/ui/ReasonBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { listIncidents, type IncidentFilters } from '@/services/incidents';
import { PRIMARY_REASONS, REASON_LABELS } from '@/config/constants';
import { fmtAge, fmtDateTime, cn } from '@/lib/utils';
import type { Incident, IncidentReason, IncidentStatus } from '@/types';

type SortKey = 'created_at' | 'supplier_nombre' | 'status' | 'age';
type SortDir = 'asc' | 'desc';

interface IncidentsViewProps {
  title: string;
  subtitle?: string;
  fixedStatus?: IncidentStatus | IncidentStatus[];
}

const PAGE_SIZE = 25;

export function IncidentsView({ title, subtitle, fixedStatus }: IncidentsViewProps) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [reason, setReason] = useState<IncidentReason | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'created_at', dir: 'desc' });

  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  // Debounce búsqueda (sección 54)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debounced, reason, fixedStatus]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const filters: IncidentFilters = {
      status: fixedStatus,
      reason: reason ?? undefined,
      search: debounced || undefined,
    };
    listIncidents(filters, page, PAGE_SIZE).then((res) => {
      if (!alive) return;
      setRows(res.rows);
      setTotal(res.total);
      setLive(res.live);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [fixedStatus, reason, debounced, page]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    const dir = sort.dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sort.key === 'age') {
        av = new Date(a.created_at).getTime();
        bv = new Date(b.created_at).getTime();
      } else if (sort.key === 'created_at') {
        av = a.created_at;
        bv = b.created_at;
      } else if (sort.key === 'supplier_nombre') {
        av = a.supplier_nombre ?? '';
        bv = b.supplier_nombre ?? '';
      } else {
        av = a.status;
        bv = b.status;
      }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return arr;
  }, [rows, sort]);

  useEffect(() => {
    if (loading || !tbodyRef.current) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from('tr[data-row]', {
        opacity: 0, y: 6, duration: 0.28, stagger: 0.015, ease: 'power2.out', clearProps: 'transform,opacity',
      });
    }, tbodyRef.current);
    return () => ctx.revert();
  }, [loading, sorted]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = !!reason || !!debounced;

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <button className="btn-primary" onClick={() => navigate('/incidents/new')}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva incidencia
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por N° incidencia, factura, documento…"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {PRIMARY_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason((cur) => (cur === r ? null : r))}
              className={cn(
                'chip h-8 px-3 border transition-colors',
                reason === r
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface text-ink-2 border-border hover:border-border-strong',
              )}
            >
              {REASON_LABELS[r]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm font-semibold text-ink-3 tabular-nums">
          {total} resultado{total === 1 ? '' : 's'}
        </span>
      </div>

      {/* Chips de filtros activos (sección 13) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {reason && (
            <FilterChip label={`Motivo: ${REASON_LABELS[reason]}`} onClear={() => setReason(null)} />
          )}
          {debounced && (
            <FilterChip label={`Búsqueda: "${debounced}"`} onClear={() => setSearch('')} />
          )}
          <button
            onClick={() => {
              setReason(null);
              setSearch('');
            }}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-3 border-b border-border text-left">
                <Th>ID</Th>
                <Th sortKey="created_at" sort={sort} onSort={toggleSort}>Fecha</Th>
                <Th sortKey="supplier_nombre" sort={sort} onSort={toggleSort}>Proveedor</Th>
                <Th>Factura</Th>
                <Th>Motivo</Th>
                <Th>Prioridad</Th>
                <Th className="text-right">Unidades</Th>
                <Th sortKey="age" sort={sort} onSort={toggleSort} className="text-right">Antigüedad</Th>
                <Th sortKey="status" sort={sort} onSort={toggleSort}>Estado</Th>
              </tr>
            </thead>
            <tbody ref={tbodyRef} className="divide-y divide-border">
              {!loading &&
                sorted.map((i) => (
                  <tr
                    key={i.id}
                    data-row
                    onClick={() => navigate(`/incidents/${i.incident_number}`)}
                    className="h-[52px] hover:bg-surface-3 cursor-pointer transition-colors"
                  >
                    <td className="px-4 font-mono text-xs font-bold text-ink whitespace-nowrap">{i.incident_number}</td>
                    <td className="px-4 text-ink-2 whitespace-nowrap">{fmtDateTime(i.created_at)}</td>
                    <td className="px-4 font-semibold text-ink max-w-[220px] truncate">{i.supplier_nombre ?? '—'}</td>
                    <td className="px-4 font-mono text-xs text-ink-2 whitespace-nowrap">{i.invoice_number ?? '—'}</td>
                    <td className="px-4"><ReasonBadge reason={i.reason} /></td>
                    <td className="px-4"><PriorityBadge priority={i.priority} /></td>
                    <td className="px-4 text-right font-mono font-semibold tabular-nums">{i.affected_units ?? '—'}</td>
                    <td className="px-4 text-right text-ink-2 tabular-nums whitespace-nowrap">{fmtAge(i.created_at)}</td>
                    <td className="px-4"><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading && <SkeletonTable rows={8} cols={9} />}
        {!loading && sorted.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="No hay incidencias"
            message={
              hasActiveFilters
                ? 'Ninguna incidencia coincide con los filtros actuales.'
                : 'Cuando se registren incidencias aparecerán aquí.'
            }
            action={
              <button className="btn-primary" onClick={() => navigate('/incidents/new')}>
                <Plus className="h-4 w-4" strokeWidth={2.5} /> Crear incidencia
              </button>
            }
          />
        )}
      </div>

      {/* Pie: paginación + origen de datos */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-2xs font-semibold text-ink-3">
          {live ? 'Datos en vivo · Supabase' : 'Vista previa · datos de ejemplo (corré schema.sql para datos reales)'}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary h-8 px-3 text-xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="text-xs font-semibold text-ink-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              className="btn-secondary h-8 px-3 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  className,
  sortKey,
  sort,
  onSort,
}: {
  children: React.ReactNode;
  className?: string;
  sortKey?: SortKey;
  sort?: { key: SortKey; dir: SortDir };
  onSort?: (k: SortKey) => void;
}) {
  const active = sortKey && sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort!.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn(
        'px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 whitespace-nowrap select-none',
        sortKey && 'cursor-pointer hover:text-ink-2',
        className,
      )}
      onClick={sortKey && onSort ? () => onSort(sortKey) : undefined}
    >
      <span className={cn('inline-flex items-center gap-1', className?.includes('text-right') && 'flex-row-reverse')}>
        {children}
        {sortKey && <Icon className={cn('h-3 w-3', active ? 'text-brand' : 'text-ink-3/60')} />}
      </span>
    </th>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="chip bg-brand-soft text-brand h-7">
      {label}
      <button onClick={onClear} className="ml-0.5 hover:text-brand-dark" aria-label="Quitar filtro">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
