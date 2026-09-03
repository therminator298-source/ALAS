import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Trend = 'up' | 'down' | 'flat';

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  foot?: string;
  trend?: Trend;
  trendValue?: string;
  accent?: string; // clase de color de texto para el valor
  onClick?: () => void;
}

const TREND_ICON: Record<Trend, LucideIcon> = { up: ArrowUp, down: ArrowDown, flat: ArrowRight };
const TREND_COLOR: Record<Trend, string> = {
  up: 'text-terminado',
  down: 'text-faltante',
  flat: 'text-ink-3',
};

export function KPICard({
  label,
  value,
  icon: Icon,
  foot,
  trend,
  trendValue,
  accent = 'text-ink',
  onClick,
}: KPICardProps) {
  const Tag = onClick ? 'button' : 'div';
  const TrendIcon = trend ? TREND_ICON[trend] : null;
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'card p-4 text-left flex flex-col gap-2 transition-all duration-200 ease-smooth',
        onClick && 'hover:border-border-strong hover:shadow-pop hover:-translate-y-0.5 cursor-pointer',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs font-bold uppercase tracking-wide text-ink-3">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-ink-3" strokeWidth={2} />}
      </div>
      <div className={cn('font-mono text-3xl font-extrabold leading-none tabular-nums', accent)}>
        {value}
      </div>
      {(foot || trend) && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
          {TrendIcon && (
            <span className={cn('inline-flex items-center gap-0.5', TREND_COLOR[trend!])}>
              <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {trendValue}
            </span>
          )}
          {foot && <span className="text-ink-3">{foot}</span>}
        </div>
      )}
    </Tag>
  );
}
