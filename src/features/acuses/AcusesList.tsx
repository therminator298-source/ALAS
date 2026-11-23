import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Ban, CalendarDays, CheckCircle2, ClipboardCheck, Clock, Download, LayoutGrid, Search, Truck, X,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SegStrip, type SegItem } from '@/components/SegStrip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { toast } from '@/components/ui/toast';
import { cn, fmtDate } from '@/lib/utils';
import { AcuseEstadoBadge } from './AcuseEstadoBadge';
import { downloadAcusesCsv, getAcuseDashboard, listAcuses, listRepartidores } from './acuseApi';
import type { AcuseEstado, AcuseFilters, AcuseRow, Repartidor } from './types';

const PAGE_SIZE = 25;

/* Mismo orden que el flujo real del papel: se emite, sale a la calle, lo firma
   el cliente. "Anulado" va al final porque es la salida de excepción. */
const SEGMENTOS: { value: 'all' | AcuseEstado; label: string; icon: typeof Clock; key: 'total' | 'pendientes' | 'enReparto' | 'entregados' | 'anulados' }[] = [
  { value: 'all', label: 'Todos', icon: LayoutGrid, key: 'total' },
  { value: 'Pendiente', label: 'Pendientes', icon: Clock, key: 'pendientes' },
  { value: 'En Reparto', label: 'En reparto', icon: Truck, key: 'enReparto' },
  { value: 'Entregado', label: 'Entregados', icon: CheckCircle2, key: 'entregados' },
  { value: 'Anulado', label: 'Anulados', icon: Ban, key: 'anulados' },
];

type Conteos = Record<'total' | 'pendientes' | 'enReparto' | 'entregados' | 'anulados', number>;

export function AcusesList({ onVerDetalle }: { onVerDetalle?: (a: AcuseRow) => void }) {
  const [estado, setEstado] = useState<'all' | AcuseEstado>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [repartidorId, setRepartidorId] = useState<number | ''>('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<AcuseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(true);
  // null = todavia no llegaron. Arrancar en cero mostraba "0 acuses" con filas a la vista.
  const [conteos, setConteos] = useState<Conteos | null>(null);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [exportando, setExportando] = useState(false);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 280);
    return () => clearTimeout(t);
  }, [search]);

  const filtros: AcuseFilters = useMemo(() => ({
    estado,
    search: debounced || undefined,
    repartidorId: repartidorId === '' ? undefined : Number(repartidorId),
    fechaDesde: desde || undefined,
    fechaHasta: hasta || undefined,
  }), [estado, debounced, repartidorId, desde, hasta]);

  useEffect(() => setPage(1), [estado, debounced, repartidorId, desde, hasta]);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    listAcuses(filtros, page).then((res) => {
      if (!vivo) return;
      setRows(res.rows);
      setTotal(res.total);
      setLive(res.live);
      setLoading(false);
    });
    return () => { vivo = false; };
  }, [filtros, page]);

  /* Los contadores NO salen de las filas de la página: con 25 por página,
     sumar lo que está a la vista daría un total distinto en cada página.
     getAcuseDashboard los cuenta en el servidor, uno por estado. */
  useEffect(() => {
    let vivo = true;
    getAcuseDashboard().then((d) => {
      if (!vivo) return;
      setConteos({
        total: d.total, pendientes: d.pendientes, enReparto: d.enReparto,
        entregados: d.entregados, anulados: d.anulados,
      });
    });
    listRepartidores().then((r) => { if (vivo) setRepartidores(r); });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    if (loading || !tbodyRef.current) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('tr[data-row]', {
        opacity: 0, y: 6, duration: 0.28, stagger: 0.015, ease: 'power2.out', clearProps: 'transform,opacity',
      });
    }, tbodyRef.current);
    return () => ctx.revert();
  }, [loading, rows]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hayFiltros = !!debounced || !!desde || !!hasta || repartidorId !== '' || estado !== 'all';

  /* Mientras no estén los conteos, el subtítulo usa el total de la consulta;
     con filtros puestos ese total es el del filtro, no el del universo, así que
     ahí se espera en vez de mostrar un número que no es el que dice ser. */
  const universo = conteos?.total ?? (hayFiltros ? null : total);
  const subtitulo = universo == null
    ? 'Cargando…'
    : `${universo} acuse${universo === 1 ? '' : 's'} registrado${universo === 1 ? '' : 's'}`;

  function limpiar() {
    setSearch(''); setDesde(''); setHasta(''); setRepartidorId(''); setEstado('all');
  }

  async function exportar() {
    setExportando(true);
    try {
      const n = await downloadAcusesCsv(filtros);
      toast(`${n} acuse${n === 1 ? '' : 's'} exportado${n === 1 ? '' : 's'}`, 'ok');
    } catch (err) {
      toast('No se pudo exportar: ' + (err as Error).message, 'err');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Gestión de Acuses"
        subtitle={subtitulo}
        /* Cinco segmentos en tamaño grande empujaban el título a dos renglones. */
        center={
          <SegStrip
            inline
            items={SEGMENTOS.map((s) => ({
              value: s.value, label: s.label, icon: s.icon, count: conteos?.[s.key],
            })) satisfies SegItem[]}
            value={estado}
            onChange={(v) => setEstado(v as 'all' | AcuseEstado)}
          />
        }
        actions={
          <button className="btn-secondary" onClick={exportar} disabled={exportando}>
            <Download className="h-4 w-4" strokeWidth={2.2} />
            {exportando ? 'Exportando…' : 'Exportar CSV'}
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 pr-9"
            placeholder="Buscar por N° de acuse, cliente o repartidor…"
            aria-label="Buscar acuses"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-6 w-6 rounded-md text-ink-3 hover:bg-surface-3"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.6} />
            </button>
          )}
        </div>

        <label className="inline-flex items-center gap-2 text-2xs font-bold uppercase tracking-wide text-ink-3">
          <CalendarDays className="h-4 w-4" aria-hidden />
          Emisión
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input h-9 w-[150px] text-sm normal-case" aria-label="Emitidos desde" />
          <span className="text-ink-3" aria-hidden>→</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input h-9 w-[150px] text-sm normal-case" aria-label="Emitidos hasta" />
        </label>

        <select
          value={repartidorId}
          onChange={(e) => setRepartidorId(e.target.value === '' ? '' : Number(e.target.value))}
          className="input h-9 w-auto min-w-[190px] text-sm"
          aria-label="Filtrar por repartidor"
        >
          <option value="">Todos los repartidores</option>
          {repartidores.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>

        {hayFiltros && (
          <button className="btn-ghost h-9 px-3 text-xs" onClick={limpiar}>
            <X className="h-3.5 w-3.5" strokeWidth={2.6} /> Limpiar filtros
          </button>
        )}

        <span className="ml-auto text-2xs font-bold text-ink-3 tabular-nums">
          {total} resultado{total === 1 ? '' : 's'}
        </span>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-3 border-b border-border text-left">
                <Th>Emisión</Th>
                <Th>Guía</Th>
                <Th>Cliente</Th>
                <Th>Destino</Th>
                <Th>Repartidor</Th>
                <Th className="text-right">Ítems</Th>
                <Th className="text-right">Unidades</Th>
                <Th>Entrega</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody ref={tbodyRef} className="divide-y divide-border">
              {!loading && rows.map((a) => (
                <tr
                  key={a.id}
                  data-row
                  onClick={() => onVerDetalle?.(a)}
                  className={cn('h-[52px] transition-colors', onVerDetalle && 'hover:bg-surface-3 cursor-pointer')}
                >
                  <td className="px-4 text-ink-2 whitespace-nowrap">{fmtDate(a.fecha_emision)}</td>
                  <td className="px-4 font-mono text-xs font-bold text-brand whitespace-nowrap">{a.nro_acuse}</td>
                  <td className="px-4 font-semibold text-ink max-w-[260px] truncate" title={a.cliente_nombre ?? ''}>
                    {a.cliente_nombre ?? '—'}
                  </td>
                  <td className="px-4 text-ink-2 max-w-[180px] truncate">{a.cliente_ciudad ?? a.zona ?? '—'}</td>
                  <td className="px-4 text-ink-2 max-w-[180px] truncate">{a.repartidor_nombre ?? '—'}</td>
                  <td className="px-4 text-right font-mono tabular-nums text-ink-2">{a.items || '—'}</td>
                  <td className="px-4 text-right font-mono font-semibold tabular-nums">{a.unidades || '—'}</td>
                  <td className="px-4 text-ink-2 whitespace-nowrap">{fmtDate(a.fecha_entrega)}</td>
                  <td className="px-4"><AcuseEstadoBadge estado={a.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <SkeletonTable rows={8} cols={9} />}
        {!loading && rows.length === 0 && (
          <EmptyState
            icon={ClipboardCheck}
            title="No hay acuses"
            message={hayFiltros
              ? 'Ningún acuse coincide con los filtros actuales.'
              : 'Cuando se emitan acuses de entrega aparecerán acá.'}
            action={hayFiltros ? <button className="btn-secondary" onClick={limpiar}>Limpiar filtros</button> : undefined}
          />
        )}
      </div>

      {/* Pie */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-2xs font-semibold text-ink-3">
          {live ? 'Datos en vivo · Supabase' : 'Vista previa · datos de ejemplo'}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button className="btn-secondary h-8 px-3 text-xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </button>
            <span className="text-xs font-semibold text-ink-2 tabular-nums">{page} / {totalPages}</span>
            <button className="btn-secondary h-8 px-3 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 whitespace-nowrap select-none', className)}>
      {children}
    </th>
  );
}
