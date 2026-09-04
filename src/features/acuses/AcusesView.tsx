import { useMemo, useRef, useState } from 'react';
import {
  BarChart3, ClipboardCheck, CalendarDays, Users, Clock, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/store/session';

interface Tab { v: string; label: string; icon: LucideIcon }
const TABS: Tab[] = [
  { v: 'resumen', label: 'Dashboard Resumen', icon: BarChart3 },
  { v: 'acuses', label: 'Gestión de Acuses', icon: ClipboardCheck },
  { v: 'calendario', label: 'Calendario', icon: CalendarDays },
  { v: 'repartidores', label: 'Repartidores', icon: Users },
  { v: 'historial', label: 'Historial', icon: Clock },
];

/**
 * Apartado Acuses (módulo independiente). Embebe el proyecto ACUSE en modo embed
 * (sin su sidebar propio); la navegación entre vistas vive arriba en este header
 * y se controla por postMessage. El main sidebar del shell sólo cambia de módulo.
 */
export function AcusesView() {
  const { user } = useSession();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [active, setActive] = useState('acuses');

  const src = useMemo(() => {
    const url = import.meta.env.VITE_ACUSE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_ACUSE_SUPABASE_ANON_KEY as string | undefined;
    const p = new URLSearchParams();
    p.set('embed', '1');
    if (url) p.set('sb', url);
    if (key) p.set('key', key);
    p.set('user', user?.nombre ?? 'Operador General');
    return `/acuse/views/dashboard-Acuses.html?${p.toString()}`;
  }, [user]);

  function go(v: string) {
    setActive(v);
    iframeRef.current?.contentWindow?.postMessage({ source: 'alas-parent', action: 'nav', view: v }, window.location.origin);
  }

  const activeLabel = TABS.find((t) => t.v === active)?.label ?? 'Acuses';

  return (
    <div className="flex flex-col h-full">
      {/* Header del módulo Acuses */}
      <div className="shrink-0 border-b border-border bg-surface px-4 md:px-6 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCheck className="h-5 w-5 text-brand" strokeWidth={2} />
          <h1 className="text-lg font-extrabold text-ink">{activeLabel}</h1>
          <span className="text-2xs font-bold uppercase tracking-wide text-ink-3 ml-1">· Acuses</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto -mb-px">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = active === t.v;
            return (
              <button
                key={t.v}
                onClick={() => go(t.v)}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm font-bold border-b-2 transition-colors',
                  on ? 'border-brand text-brand' : 'border-transparent text-ink-3 hover:text-ink-2',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* App ACUSE embebida */}
      <iframe
        ref={iframeRef}
        src={src}
        title="Acuses"
        className="flex-1 w-full border-0 block"
        allow="clipboard-write"
      />
    </div>
  );
}
