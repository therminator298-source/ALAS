import type { MonthlyPoint } from '@/services/dashboard';
import { cn } from '@/lib/utils';

interface Props {
  data: MonthlyPoint[];
}

/**
 * Barras de incidencias por mes (últimos 12). Una sola serie → sin leyenda;
 * el título la nombra. Etiqueta directa solo en el valor máximo; el resto se
 * lee al pasar el mouse (tooltip nativo). Grilla y ejes recesivos.
 */
export function MonthlyBars({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const totalPeriodo = data.reduce((a, d) => a + d.total, 0);

  return (
    <div>
      <div className="flex items-end gap-1.5 h-44 px-1" role="img" aria-label="Incidencias por mes">
        {data.map((d) => {
          const h = (d.total / max) * 100;
          const isMax = d.total === max && d.total > 0;
          return (
            <div key={d.key} className="group relative flex-1 flex flex-col items-center justify-end h-full">
              {/* etiqueta directa solo en el pico; el resto en hover */}
              <span
                className={cn(
                  'text-2xs font-bold tabular-nums mb-1 transition-opacity',
                  isMax ? 'text-ink-2 opacity-100' : 'text-ink-3 opacity-0 group-hover:opacity-100',
                )}
              >
                {d.total}
              </span>
              <div
                title={`${d.label}: ${d.total} incidencia${d.total === 1 ? '' : 's'}`}
                className={cn(
                  'w-full rounded-t-[4px] transition-colors',
                  d.total > 0 ? 'bg-brand/80 group-hover:bg-brand' : 'bg-surface-3',
                )}
                style={{ height: `${Math.max(d.total > 0 ? 4 : 2, h)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 px-1 mt-1.5">
        {data.map((d) => (
          <span key={d.key} className="flex-1 text-center text-2xs font-medium text-ink-3 truncate">
            {d.label.split(' ')[0]}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-3">
        {totalPeriodo} incidencia{totalPeriodo === 1 ? '' : 's'} en los últimos 12 meses
      </p>
    </div>
  );
}
