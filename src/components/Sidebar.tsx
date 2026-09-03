import { NavLink } from 'react-router-dom';
import {
  CheckCircle,
  ClipboardList,
  Clock,
  FileBarChart,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Plus,
  Settings,
  ShieldCheck,
  Truck,
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
  end?: boolean;
  badgeKey?: 'pendientes' | 'revision' | 'verificados';
}

interface SidebarProps {
  user: User;
  sessionSource: SessionSource;
  onLogout: () => void;
  onReturnToLauncher: () => void;
  badges?: Partial<Record<'pendientes' | 'revision' | 'verificados', number>>;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard Resumen', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Nueva incidencia', to: '/incidents/new', icon: Plus },
  { label: 'Todas las incidencias', to: '/incidents', icon: ClipboardList, end: true },
  { label: 'Pendientes', to: '/incidents/pending', icon: Clock, badgeKey: 'pendientes' },
  { label: 'En revision', to: '/incidents/review', icon: ClipboardList, badgeKey: 'revision' },
  { label: 'Verificadas', to: '/incidents/verified', icon: CheckCircle, badgeKey: 'verificados' },
  { label: 'Reportes', to: '/reports', icon: FileBarChart },
  { label: 'Proveedores', to: '/suppliers', icon: Truck },
  { label: 'Productos', to: '/products', icon: Package },
  { label: 'Auditoria', to: '/audit', icon: ShieldCheck },
  { label: 'Configuracion', to: '/settings', icon: Settings },
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` : name.slice(0, 2);
  return initials.toUpperCase();
}

function sourceLabel(source: SessionSource): string {
  return source === 'launcher' ? 'Launcher ALAS' : 'Modo demo';
}

export function Sidebar({ user, sessionSource, onLogout, onReturnToLauncher, badges = {} }: SidebarProps) {
  return (
    <nav className="sidebar-wave" aria-label="Barra lateral ALAS">
      <div className="sidebar-icons">
        <NavLink to="/dashboard" className="sidebar-brand" aria-label="Ir al dashboard">
          <img src="/icon-192.png" alt="" className="sidebar-brand__icon" />
          <img src="/logo-alas-blanco.png" alt="ALAS" className="sidebar-brand__wordmark" />
        </NavLink>

        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const count = item.badgeKey ? badges[item.badgeKey] : undefined;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn('sidebar-icon', isActive && 'active')}
              aria-label={item.label}
              title={item.label}
            >
              <Icon aria-hidden="true" />
              <span className="tooltip">{item.label}</span>
              {typeof count === 'number' && count > 0 && <span className="sidebar-badge">{count}</span>}
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

        <button type="button" onClick={onLogout} className="sidebar-icon" aria-label="Cerrar sesion">
          <LogOut aria-hidden="true" />
          <span className="tooltip">Cerrar sesion</span>
        </button>

        <div className="sidebar-brand" aria-label="Usuario activo">
          <span className="sidebar-brand__icon grid place-items-center bg-white text-[11px] font-black text-brand">
            {initialsFor(user.nombre)}
          </span>
          <span className="sidebar-user-label">
            <span>{user.nombre}</span>
            <small>{sourceLabel(sessionSource)}</small>
          </span>
        </div>
      </div>
    </nav>
  );
}
