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
  items, value, onChange, className, equal = false, size = 'md', inline = false,
}: {
  items: SegItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  /** Segmentos del mismo ancho (flex-1). */
  equal?: boolean;
  /** Tamaño del control. */
  size?: 'md' | 'lg';
  /** Con contador: label y número en una sola línea (más lineal) en vez de apilados. */
  inline?: boolean;
}) {
  const lg = size === 'lg';
  return (
    <div className={cn('items-stretch rounded-2xl border border-border bg-surface overflow-hidden shadow-[0_2px_12px_rgba(15,36,64,0.07)]', equal ? 'flex' : 'inline-flex', className)}>
      {items.map((it) => {
        const on = it.value === value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn(
              'group flex items-center border-l first:border-l-0 border-border transition-all duration-200 active:scale-[0.98]',
              lg ? 'gap-3.5 px-7 md:px-9 py-4' : 'gap-3 px-5 md:px-6 py-3',
              equal ? 'flex-1 justify-center' : '',
              on ? 'bg-gradient-to-br from-[#1478b8] to-brand text-white' : 'hover:bg-surface-3',
            )}
          >
            <Icon
              className={cn('shrink-0 transition-transform group-hover:scale-110', lg ? 'h-7 w-7' : 'h-6 w-6', on ? 'text-white' : 'text-ink-3')}
              strokeWidth={1.9}
            />
            {it.count != null ? (
              inline ? (
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={cn('font-extrabold uppercase tracking-wide whitespace-nowrap', lg ? 'text-[13px]' : 'text-[11px]', on ? 'text-white/90' : 'text-ink-2')}>{it.label}</span>
                  <span className={cn('font-extrabold tabular-nums leading-none', lg ? 'text-[26px]' : 'text-[22px]', on ? 'text-white' : 'text-ink')}>{it.count}</span>
                </span>
              ) : (
                <span className={cn('flex flex-col leading-none min-w-0', equal ? 'items-center' : 'items-start')}>
                  <span className={cn('font-extrabold uppercase tracking-wide whitespace-nowrap', lg ? 'text-[12px]' : 'text-[11px]', on ? 'text-white/85' : 'text-ink-3')}>{it.label}</span>
                  <span className={cn('font-extrabold tabular-nums', lg ? 'text-[26px] mt-2' : 'text-[22px] mt-1.5', on ? 'text-white' : 'text-ink')}>{it.count}</span>
                </span>
              )
            ) : (
              <span className={cn('font-bold whitespace-nowrap', lg ? 'text-base' : 'text-sm', on ? 'text-white' : 'text-ink-2')}>{it.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
