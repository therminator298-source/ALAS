import { useMemo, useRef, useState } from 'react';
import {
  BarChart3, ClipboardCheck, CalendarDays, Users, Clock, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/store/session';

// Proyecto Supabase de Acuses. La anon key es pública por diseño (RLS anon, gate = SSO).
const ACUSE_SB_URL = 'https://fdcumrdbnrjpbfbrxqiw.supabase.co';
const ACUSE_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkY3VtcmRibnJqcGJmYnJ4cWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTU1NjAsImV4cCI6MjA5OTYzMTU2MH0.YHsYBm-pnzu53BiZFikQef4CEYDzxGoToL_J4iH1wgY';

interface Tab { v: string; label: string; icon: LucideIcon }
const TABS: Tab[] = [
  { v: 'resumen', label: 'Dashboard Resumen', icon: BarChart3 },
  { v: 'acuses', label: 'Acuses', icon: ClipboardCheck },
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
    // Default = proyecto Supabase de Acuses (anon key pública por diseño; RLS anon).
    // Las env vars de Vercel, si están, tienen prioridad.
    const url = (import.meta.env.VITE_ACUSE_SUPABASE_URL as string | undefined) || ACUSE_SB_URL;
    const key = (import.meta.env.VITE_ACUSE_SUPABASE_ANON_KEY as string | undefined) || ACUSE_SB_KEY;
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

  return (
    <div className="flex flex-col h-full">
      {/* Header del módulo Acuses — título a la izquierda, tabs centrados */}
      <div className="relative shrink-0 border-b border-border bg-surface px-4 md:px-6 py-3">
        <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-brand" strokeWidth={2.2} />
          <span className="hidden sm:block text-base font-extrabold text-ink">Gestión de Acuses</span>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = active === t.v;
            return (
              <button
                key={t.v}
                onClick={() => go(t.v)}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 active:scale-[0.97]',
                  on
                    ? 'bg-brand text-white shadow-pop'
                    : 'bg-surface-2 text-ink-2 border border-border hover:border-brand/40 hover:text-brand hover:-translate-y-px',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} />
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
        className="flex-1 w-full border-0 block bg-white"
        allow="clipboard-write"
      />
    </div>
  );
}
