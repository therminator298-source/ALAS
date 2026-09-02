import { Bell, Search, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { APP_NAME, ROLE_LABELS } from '@/config/constants';
import type { User } from '@/types';

const CRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  incidents: 'Incidencias',
  new: 'Nueva',
  pending: 'Pendientes',
  review: 'En revisión',
  verified: 'Verificadas',
  resolution: 'En resolución',
  completed: 'Terminadas',
  reports: 'Reportes',
  suppliers: 'Proveedores',
  products: 'Productos',
  audit: 'Auditoría',
  settings: 'Configuración',
};

interface TopbarProps {
  user: User;
  onOpenSearch: () => void;
  notifCount?: number;
}

export function Topbar({ user, onOpenSearch, notifCount = 0 }: TopbarProps) {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((s) => CRUMB_LABELS[s] ?? decodeURIComponent(s));

  return (
    <header className="flex items-center gap-4 h-16 px-5 border-b border-border bg-surface shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm font-extrabold text-ink whitespace-nowrap">{APP_NAME}</span>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="h-3.5 w-3.5 text-ink-3 shrink-0" />
            <span
              className={
                i === crumbs.length - 1
                  ? 'text-sm font-semibold text-ink-2 truncate'
                  : 'text-sm text-ink-3 truncate'
              }
            >
              {c}
            </span>
          </span>
        ))}
      </div>

      {/* Buscador global (Ctrl+K) */}
      <button
        onClick={onOpenSearch}
        className="ml-auto hidden md:flex items-center gap-2 h-9 w-72 px-3 rounded-lg border border-border bg-surface-2 text-ink-3 hover:border-border-strong transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar incidencia, proveedor…</span>
        <kbd className="ml-auto font-mono text-2xs font-semibold px-1.5 py-0.5 rounded border border-border bg-surface">
          Ctrl K
        </kbd>
      </button>

      <button
        onClick={onOpenSearch}
        className="md:hidden ml-auto grid place-items-center h-9 w-9 rounded-lg border border-border text-ink-2"
        aria-label="Buscar"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      {/* Notificaciones */}
      <button
        className="relative grid place-items-center h-9 w-9 rounded-lg text-ink-2 hover:bg-surface-3 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" />
        {notifCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-faltante text-white text-[10px] font-bold tabular-nums">
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>

      {/* Usuario */}
      <div className="flex items-center gap-2.5 pl-3 border-l border-border">
        <div className="hidden sm:block text-right leading-tight">
          <div className="text-[13px] font-bold text-ink">{user.nombre}</div>
          <div className="text-2xs font-semibold text-ink-3">{ROLE_LABELS[user.rol]}</div>
        </div>
        <div className="grid place-items-center h-9 w-9 rounded-full bg-brand-soft text-brand font-bold text-sm">
          {user.nombre.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
