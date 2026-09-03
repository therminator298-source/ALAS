import { Bell, ChevronRight, LogOut, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { APP_NAME, ROLE_LABELS } from '@/config/constants';
import type { SessionSource } from '@/lib/alasSso';
import type { User } from '@/types';

const CRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  incidents: 'Incidencias',
  new: 'Nueva',
  pending: 'Pendientes',
  review: 'En revision',
  verified: 'Verificadas',
  resolution: 'En resolucion',
  completed: 'Terminadas',
  reports: 'Reportes',
  suppliers: 'Proveedores',
  products: 'Productos',
  audit: 'Auditoria',
  settings: 'Configuracion',
};

interface TopbarProps {
  user: User;
  onOpenSearch: () => void;
  notifCount?: number;
  sessionSource?: SessionSource;
  onLogout?: () => void;
}

function sourceLabel(source?: SessionSource): string {
  return source === 'launcher' ? 'Launcher' : 'Demo';
}

export function Topbar({ user, onOpenSearch, notifCount = 0, sessionSource = 'demo', onLogout }: TopbarProps) {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((s) => CRUMB_LABELS[s] ?? decodeURIComponent(s));

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface px-5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="whitespace-nowrap text-sm font-extrabold text-ink">{APP_NAME}</span>
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-3" />
            <span
              className={
                i === crumbs.length - 1
                  ? 'truncate text-sm font-semibold text-ink-2'
                  : 'truncate text-sm text-ink-3'
              }
            >
              {c}
            </span>
          </span>
        ))}
      </div>

      <button
        onClick={onOpenSearch}
        className="ml-auto hidden h-9 w-72 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-ink-3 transition-colors hover:border-border-strong md:flex"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar incidencia, proveedor...</span>
        <kbd className="ml-auto rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-2xs font-semibold">
          Ctrl K
        </kbd>
      </button>

      <button
        onClick={onOpenSearch}
        className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-border text-ink-2 md:hidden"
        aria-label="Buscar"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      <button
        className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-3"
        aria-label="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" />
        {notifCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-faltante px-1 text-[10px] font-bold tabular-nums text-white">
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2.5 border-l border-border pl-3">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-[13px] font-bold text-ink">{user.nombre}</div>
          <div className="text-2xs font-semibold text-ink-3">
            {ROLE_LABELS[user.rol]} - {sourceLabel(sessionSource)}
          </div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
          {user.nombre.charAt(0).toUpperCase()}
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
            aria-label="Cerrar sesion"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </header>
  );
}
