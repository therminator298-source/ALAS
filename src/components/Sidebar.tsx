import { NavLink, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutGrid,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { ROLE_LABELS } from '@/config/constants';
import type { SessionSource } from '@/lib/alasSso';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface SidebarItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Prefijos de ruta que mantienen activo el apartado. */
  match: string[];
}

interface SidebarProps {
  user: User;
  sessionSource: SessionSource;
  onReturnToLauncher: () => void;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Incidencias de recepción',
    to: '/dashboard',
    icon: ClipboardList,
    match: ['/dashboard', '/incidents', '/reports', '/suppliers', '/products', '/audit'],
  },
  { label: 'Acuses', to: '/acuses', icon: FileText, match: ['/acuses'] },
  { label: 'Calendario tareas', to: '/calendario', icon: CalendarDays, match: ['/calendario'] },
];

function sourceLabel(source: SessionSource): string {
  return source === 'launcher' ? 'Launcher ALAS' : 'Modo demo';
}

export function Sidebar({ user, sessionSource, onReturnToLauncher }: SidebarProps) {
  const { pathname } = useLocation();

  return (
    <nav className="sidebar-wave" aria-label="Barra lateral ALAS">
      <div className="sidebar-icons">
        <NavLink to="/dashboard" className="sidebar-brand" aria-label="Ir al inicio">
          <img src="/logo-icon.png" alt="" className="sidebar-brand__icon" />
          <img src="/logo-alas-blanco.png" alt="ALAS" className="sidebar-brand__wordmark" />
        </NavLink>

        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match.some((p) => pathname === p || pathname.startsWith(p + '/'));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn('sidebar-icon', active && 'active')}
              aria-label={item.label}
              title={item.label}
            >
              <Icon aria-hidden="true" />
              <span className="tooltip">{item.label}</span>
            </NavLink>
          );
        })}

        <div className="sidebar-spacer" />

        <button type="button" className="sidebar-icon" title={`${user.nombre} - ${ROLE_LABELS[user.rol]}`}>
          <UserCircle aria-hidden="true" />
          <span className="sidebar-user-label">
            <span>{user.nombre}</span>
            <small>{ROLE_LABELS[user.rol]} - {sourceLabel(sessionSource)}</small>
          </span>
        </button>

        <button type="button" onClick={onReturnToLauncher} className="sidebar-icon" aria-label="Volver al launcher">
          <LayoutGrid aria-hidden="true" />
          <span className="tooltip">Volver a Menu</span>
        </button>
      </div>
    </nav>
  );
}
