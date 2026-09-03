import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { listAuditLogs } from '@/services/audit';
import { ROLE_LABELS } from '@/config/constants';
import { fmtDateTime, cn } from '@/lib/utils';
import type { AuditAction, AuditLog, Role } from '@/types';

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Creación',
  UPDATE: 'Modificación',
  DELETE: 'Anulación',
  VERIFY: 'Verificación',
  ASSIGN: 'Asignación',
  STATUS_CHANGE: 'Cambio de estado',
  COMMENT: 'Comentario',
  UPLOAD: 'Carga de archivo',
  DOWNLOAD: 'Descarga',
  EXPORT: 'Exportación',
  PDF_GENERATED: 'PDF generado',
  PDF_PRINTED: 'PDF impreso',
  PDF_DOWNLOADED: 'PDF descargado',
  LOGIN: 'Ingreso',
  LOGOUT: 'Salida',
};

const ACTION_STYLE: Partial<Record<AuditAction, string>> = {
  CREATE: 'text-brand bg-brand/10',
  STATUS_CHANGE: 'text-revision bg-revision/10',
  VERIFY: 'text-terminado bg-terminado/10',
  ASSIGN: 'text-averiado bg-averiado/10',
  DELETE: 'text-critical bg-critical/10',
  COMMENT: 'text-ink-2 bg-surface-3',
};

const ACTION_OPTIONS: AuditAction[] = [
  'CREATE', 'STATUS_CHANGE', 'VERIFY', 'ASSIGN', 'DELETE', 'COMMENT', 'EXPORT', 'PDF_GENERATED',
];

export function Audit() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<AuditAction | ''>('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debounced, action]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listAuditLogs({ action: action || undefined, search: debounced || undefined }, page, PAGE_SIZE).then((res) => {
      if (!alive) return;
      setRows(res.rows);
      setTotal(res.total);
      setLive(res.live);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [action, debounced, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Auditoría" subtitle="Trazabilidad de todas las acciones del sistema" />

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuario o N° de incidencia…"
            className="input pl-9"
          />
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as AuditAction | '')}
          className="input h-9 w-auto min-w-[180px]"
        >
          <option value="">Todas las acciones</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
        <span className="ml-auto text-sm font-semibold text-ink-3 tabular-nums">
          {total.toLocaleString('es-PY')} evento{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-3 border-b border-border text-left">
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-44">Fecha / hora</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3">Usuario</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-40">Acción</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-36">Registro</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-28">Módulo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading &&
                rows.map((r) => {
                  const isInc = !!r.record && /^INC-/.test(r.record);
                  return (
                    <tr key={r.audit_id} className="h-[46px] hover:bg-surface-3 transition-colors">
                      <td className="px-4 text-ink-2 whitespace-nowrap tabular-nums">{fmtDateTime(r.created_at)}</td>
                      <td className="px-4">
                        <div className="font-semibold text-ink">{r.user_nombre ?? '—'}</div>
                        <div className="text-2xs text-ink-3">{ROLE_LABELS[r.rol as Role] ?? r.rol ?? ''}</div>
                      </td>
                      <td className="px-4">
                        <span className={cn('chip h-6 px-2.5 text-2xs font-bold', ACTION_STYLE[r.action] ?? 'text-ink-2 bg-surface-3')}>
                          {ACTION_LABELS[r.action] ?? r.action}
                        </span>
                      </td>
                      <td className="px-4">
                        {isInc ? (
                          <button
                            onClick={() => navigate(`/incidents/${r.record}`)}
                            className="font-mono text-xs font-bold text-brand hover:underline"
                          >
                            {r.record}
                          </button>
                        ) : (
                          <span className="font-mono text-xs text-ink-3">{r.record ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 text-ink-3 capitalize">{r.module}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {loading && <SkeletonTable rows={10} cols={5} />}
        {!loading && rows.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title="Sin eventos de auditoría"
            message={
              debounced || action
                ? 'Ningún evento coincide con los filtros.'
                : 'Las acciones sobre incidencias quedarán registradas aquí.'
            }
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-2xs font-semibold text-ink-3">
          {live ? 'Datos en vivo · Supabase' : 'Sin conexión · el registro de auditoría requiere Supabase'}
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
