import { cn } from '@/lib/utils';

export interface CategoryRow {
  label: string;
  value: number;
  /** Clase Tailwind de fondo para la barra (token de color). */
  color: string;
}

/**
 * Barras horizontales para una dimensión categórica (motivo, estado…).
 * Una barra por fila, valor a la derecha; el ancho codifica la magnitud.
 */
export function CategoryBars({ data }: { data: CategoryRow[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="text-sm text-ink-3 py-6 text-center">Sin datos en el período.</p>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs font-semibold text-ink-2 truncate" title={d.label}>
            {d.label}
          </span>
          <div className="flex-1 h-5 rounded-[4px] bg-surface-3 overflow-hidden">
            <div
              className={cn('h-full rounded-[4px] transition-all', d.color)}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-ink tabular-nums">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
