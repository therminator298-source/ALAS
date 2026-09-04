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
    <div className={cn('inline-flex items-stretch rounded-2xl border border-border bg-surface overflow-hidden shadow-[0_2px_12px_rgba(15,36,64,0.07)]', className)}>
      {items.map((it) => {
        const on = it.value === value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn(
              'group flex items-center gap-3 px-5 md:px-6 py-3 border-l first:border-l-0 border-border transition-all duration-200 active:scale-[0.98]',
              on ? 'bg-gradient-to-br from-[#1478b8] to-brand text-white' : 'hover:bg-surface-3',
            )}
          >
            <Icon
              className={cn('h-6 w-6 shrink-0 transition-transform group-hover:scale-110', on ? 'text-white' : 'text-ink-3')}
              strokeWidth={1.9}
            />
            {it.count != null ? (
              <span className="flex flex-col items-start leading-none min-w-0">
                <span className={cn('text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap', on ? 'text-white/85' : 'text-ink-3')}>{it.label}</span>
                <span className={cn('text-[22px] font-extrabold tabular-nums mt-1.5', on ? 'text-white' : 'text-ink')}>{it.count}</span>
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
