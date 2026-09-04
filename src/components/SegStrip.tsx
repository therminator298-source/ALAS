import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SegItem {
  value: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

/**
 * Segmentado tipo "Caja Pedidos" de CajaVenta: chips unidos con divisor,
 * ícono + label (+ número opcional), activo relleno azul de marca.
 */
export function SegStrip({
  items, value, onChange, className,
}: {
  items: SegItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-stretch rounded-2xl border border-border bg-surface overflow-hidden shadow-sm', className)}>
      {items.map((it) => {
        const on = it.value === value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn(
              'group flex items-center gap-2.5 px-4 md:px-5 py-2.5 border-l first:border-l-0 border-border transition-colors active:scale-[0.98]',
              on ? 'bg-brand text-white' : 'hover:bg-surface-3',
            )}
          >
            <Icon
              className={cn('h-[22px] w-[22px] shrink-0 transition-transform group-hover:scale-110', on ? 'text-white' : 'text-ink-3')}
              strokeWidth={1.9}
            />
            {it.count != null ? (
              <span className="flex flex-col items-start leading-none min-w-0">
                <span className={cn('text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap', on ? 'text-white/85' : 'text-ink-3')}>{it.label}</span>
                <span className={cn('text-xl font-extrabold tabular-nums mt-1', on ? 'text-white' : 'text-ink')}>{it.count}</span>
              </span>
            ) : (
              <span className={cn('text-sm font-bold whitespace-nowrap', on ? 'text-white' : 'text-ink-2')}>{it.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
