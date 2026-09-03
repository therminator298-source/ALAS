import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Truck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { getReportData, type ReportData, type SupplierStat } from '@/services/reports';

export function Suppliers() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReportData | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    getReportData().then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo<SupplierStat[]>(() => {
    if (!data) return [];
    const lo = search.trim().toLowerCase();
    return lo ? data.suppliers.filter((s) => s.nombre.toLowerCase().includes(lo)) : data.suppliers;
  }, [data, search]);

  const loading = !data;

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Proveedores" subtitle="Incidencias por proveedor · desempeño de recepción" />

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proveedor…"
            className="input pl-9"
          />
        </div>
        <span className="ml-auto text-sm font-semibold text-ink-3 tabular-nums">
          {filtered.length} proveedor{filtered.length === 1 ? '' : 'es'}
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-3 border-b border-border text-left">
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3">Proveedor</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-24 text-right">Total</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-24 text-right">Abiertas</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-28 text-right">Terminadas</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-40">Resolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading &&
                filtered.map((s) => {
                  const rate = s.total ? Math.round((s.terminadas / s.total) * 100) : 0;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/incidents?supplier=${encodeURIComponent(s.nombre)}`)}
                      className="h-[48px] hover:bg-surface-3 cursor-pointer transition-colors"
                    >
                      <td className="px-4 font-semibold text-ink max-w-[360px] truncate">{s.nombre}</td>
                      <td className="px-4 text-right font-mono font-bold tabular-nums">{s.total}</td>
                      <td className="px-4 text-right font-mono tabular-nums text-averiado">{s.abiertas}</td>
                      <td className="px-4 text-right font-mono tabular-nums text-terminado">{s.terminadas}</td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                            <div className="h-full rounded-full bg-terminado" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="w-9 text-right text-2xs font-bold text-ink-2 tabular-nums">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {loading && <SkeletonTable rows={8} cols={5} />}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={Truck}
            title="Sin proveedores"
            message={search ? `Ningún proveedor coincide con "${search}".` : 'Cuando haya incidencias con proveedor aparecerán aquí.'}
          />
        )}
      </div>

      {data && (
        <p className="mt-3 text-2xs font-semibold text-ink-3">
          {data.live ? 'Datos en vivo · Supabase' : 'Vista previa · datos de ejemplo'}
        </p>
      )}
    </div>
  );
}
