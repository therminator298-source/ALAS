import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Contenido centrado en la misma línea (ej. un filtro segmentado). */
  center?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, center }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold text-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-3 mt-0.5">{subtitle}</p>}
      </div>
      {center && <div className="flex-1 flex justify-center min-w-0">{center}</div>}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
