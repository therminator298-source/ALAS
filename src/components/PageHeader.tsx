import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Contenido centrado en la misma línea (ej. un filtro segmentado). */
  center?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, center }: PageHeaderProps) {
  const titulo = (
    <div className="min-w-0">
      <h1 className="text-xl font-extrabold text-ink leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-ink-3 mt-0.5">{subtitle}</p>}
    </div>
  );

  /* Con `center`, tres pistas 1fr–auto–1fr en vez de justify-between: así lo
     del medio queda centrado en el ancho de la página y no en el hueco que
     dejan el título y los botones, que casi nunca miden lo mismo.

     Abajo de lg se apila, porque tres bloques en una línea no entran en un
     teléfono y el del medio terminaría aplastado contra los botones. */
  if (center) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-3 lg:gap-4 mb-5">
        {titulo}
        <div className="min-w-0 lg:justify-self-center">{center}</div>
        <div className="flex items-center gap-2 lg:justify-self-end">{actions}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      {titulo}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
