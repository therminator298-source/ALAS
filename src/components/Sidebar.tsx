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
  { label: 'Acuses', to: '/acuses', icon: FileText, match: ['/acuses'] },
  {
    label: 'Incidencias de recepción',
    to: '/incidents',
    icon: ClipboardList,
    match: ['/incidents', '/dashboard', '/reports', '/suppliers', '/products', '/audit'],
  },
];

/* El Calendario no esta en la barra: solo lo ve el rol CALENDARIO, que entra
   directo a /calendario y no tiene a donde mas ir. La ruta sigue existiendo. */
const CALENDAR_ONLY: SidebarItem[] = [
  { label: 'Calendario tareas', to: '/calendario', icon: CalendarDays, match: ['/calendario'] },
];

function sourceLabel(source: SessionSource): string {
  return source === 'launcher' ? 'Launcher ALAS' : 'Modo demo';
}

export function Sidebar({ user, sessionSource, onReturnToLauncher }: SidebarProps) {
  const { pathname } = useLocation();
  // CALENDARIO lleva su propia lista: el Calendario ya no esta en SIDEBAR_ITEMS,
  // asi que filtrarlo por ruta dejaria la barra vacia para ese rol.
  const visibleItems = user.rol === 'CALENDARIO'
    ? CALENDAR_ONLY
    : user.rol === 'ACUSES'
      ? SIDEBAR_ITEMS.filter((item) => item.to === '/acuses')
      : SIDEBAR_ITEMS;

  return (
    <nav className="sidebar-wave" aria-label="Barra lateral ALAS">
      <div className="sidebar-icons">
        {visibleItems.map((item) => {
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
