import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, ClipboardCheck, CalendarDays, Users, Clock, type LucideIcon,
} from 'lucide-react';
import { useSession } from '@/store/session';
import { cn } from '@/lib/utils';

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
  const requestedView = useRef('acuses');
  const ready = useRef(false);
  const reportedView = useRef('');

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.source !== 'alas-acuses') return;
      if (event.data.action === 'ready') {
        ready.current = true;
        if (reportedView.current !== requestedView.current) {
          iframeRef.current?.contentWindow?.postMessage({ source: 'alas-parent', action: 'nav', view: requestedView.current }, window.location.origin);
        }
      } else if (event.data.action === 'view' && TABS.some(tab => tab.v === event.data.view)) {
        reportedView.current = event.data.view;
        if (ready.current) {
          requestedView.current = event.data.view;
          setActive(event.data.view);
        }
      }
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

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
    requestedView.current = v;
    setActive(v);
    iframeRef.current?.contentWindow?.postMessage({ source: 'alas-parent', action: 'nav', view: v }, window.location.origin);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header del módulo Acuses — título a la izquierda, tabs centrados */}
      <div className="shrink-0 border-b border-border bg-surface px-3 md:px-5 py-2 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardCheck className="h-5 w-5 text-brand shrink-0" strokeWidth={2.2} />
          <h1 className="text-base font-bold text-ink">Acuses</h1>
        </div>
        <select aria-label="Vista de Acuses" value={active} onChange={event => go(event.target.value)} className="md:hidden input h-11 text-base flex-1 min-w-0 max-w-[240px] ml-auto">
          {TABS.map(tab => <option key={tab.v} value={tab.v}>{tab.label}</option>)}
        </select>
        <div role="tablist" aria-label="Vistas de Acuses" className="hidden md:flex flex-1 flex-wrap justify-end gap-1">
          {TABS.map(tab => <button key={tab.v} type="button" role="tab" aria-selected={active === tab.v} onClick={() => go(tab.v)}
            className={cn('inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold', active === tab.v ? 'bg-brand text-white' : 'text-ink-2 hover:bg-surface-3')}>
            <tab.icon className="h-4 w-4 shrink-0" />{tab.label}
          </button>)}
        </div>
      </div>

      {/* App ACUSE embebida */}
      <iframe
        ref={iframeRef}
        src={src}
        title="Acuses"
        className="flex-1 min-h-0 w-full border-0 block bg-white"
        allow="clipboard-write"
      />
    </div>
  );
}
