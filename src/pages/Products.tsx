import { useEffect, useState } from 'react';
import { Search, PackageSearch } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { listProducts } from '@/services/catalogs';
import type { Product } from '@/types';

const PAGE_SIZE = 50;

export function Products() {
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debounced]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listProducts(debounced, page, PAGE_SIZE).then((res) => {
      if (!alive) return;
      setRows(res.rows);
      setTotal(res.total);
      setLive(res.live);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [debounced, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Productos" subtitle="Catálogo de mercaderías" />

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o descripción…"
            className="input pl-9"
          />
        </div>
        <span className="ml-auto text-sm font-semibold text-ink-3 tabular-nums">
          {total.toLocaleString('es-PY')} producto{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-3 border-b border-border text-left">
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-48">Código</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3">Descripción</th>
                <th className="px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-3 w-24 text-right">UM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading &&
                rows.map((p) => (
                  <tr key={p.id} className="h-[46px] hover:bg-surface-3 transition-colors">
                    <td className="px-4 font-mono text-xs font-bold text-ink whitespace-nowrap">{p.codigo}</td>
                    <td className="px-4 text-ink-2">{p.descripcion}</td>
                    <td className="px-4 text-right text-ink-3 font-medium">{p.um}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading && <SkeletonTable rows={10} cols={3} />}
        {!loading && rows.length === 0 && (
          <EmptyState
            icon={PackageSearch}
            title="Sin productos"
            message={
              debounced
                ? `Ningún producto coincide con "${debounced}".`
                : 'Importá db/products.csv en la tabla products (Supabase → Table Editor).'
            }
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-2xs font-semibold text-ink-3">
          {live ? 'Datos en vivo · Supabase' : 'Vista previa · datos de ejemplo (importá db/products.csv)'}
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
