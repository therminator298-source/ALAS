import { Bell, LogOut, Search } from 'lucide-react';
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

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` : name.slice(0, 2);
  return initials.toUpperCase();
}

export function Topbar({ user, onOpenSearch, notifCount = 0, sessionSource = 'demo', onLogout }: TopbarProps) {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const section = segments.length ? CRUMB_LABELS[segments[segments.length - 1] ?? ''] ?? APP_NAME : 'Dashboard';

  return (
    <header className="alas-model-topbar">
      <div className="alas-model-brand">
        <img src="/logo-alas.png" alt="ALAS" />
        <div className="alas-model-title">
          <h1>{APP_NAME}</h1>
          <p>{section}</p>
        </div>
      </div>

      <button type="button" onClick={onOpenSearch} className="alas-model-search">
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Buscar incidencia, proveedor...</span>
        <kbd className="ml-auto rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-2xs font-semibold">
          Ctrl K
        </kbd>
      </button>

      <button type="button" className="alas-model-icon-button relative" aria-label="Notificaciones">
        <Bell className="h-[18px] w-[18px]" />
        {notifCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-faltante px-1 text-[10px] font-bold tabular-nums text-white">
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>

      <div className="alas-model-user">
        <div className="alas-model-user__text">
          <div className="alas-model-user__name">{user.nombre}</div>
          <div className="alas-model-user__role">
            {ROLE_LABELS[user.rol]} - {sourceLabel(sessionSource)}
          </div>
        </div>
        <div className="alas-model-user__avatar">{initialsFor(user.nombre)}</div>
        {onLogout && (
          <button type="button" onClick={onLogout} className="alas-model-icon-button" aria-label="Cerrar sesion">
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </header>
  );
}
