import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, LayoutGrid, LogOut, UserCircle } from 'lucide-react';
import { ROLE_LABELS } from '@/config/constants';
import { NAV } from '@/config/nav';
import type { SessionSource } from '@/lib/alasSso';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: User;
  sessionSource: SessionSource;
  onLogout: () => void;
  onReturnToLauncher: () => void;
  badges?: Partial<Record<'pendientes' | 'revision' | 'verificados', number>>;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` : name.slice(0, 2);
  return initials.toUpperCase();
}

function sourceLabel(source: SessionSource): string {
  return source === 'launcher' ? 'Launcher ALAS' : 'Modo demo';
}

export function Sidebar({
  collapsed,
  onToggle,
  user,
  sessionSource,
  onLogout,
  onReturnToLauncher,
  badges = {},
}: SidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Incidencias: true });

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 bg-brand text-white shadow-pop transition-[width] duration-300 ease-smooth',
        collapsed ? 'w-16' : 'w-72',
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/15 px-4">
        <img src="/icon-192.png" alt="ALAS" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
        {!collapsed && (
          <div className="min-w-0">
            <img src="/logo-alas-blanco.png" alt="ALAS" className="h-7 w-auto" />
            <p className="mt-0.5 text-[11px] font-bold uppercase leading-tight tracking-wide text-white/70">
              Calendario tareas
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isGroup = !!item.children?.length;
          const groupOpen = openGroups[item.label] ?? false;
          const active =
            location.pathname === item.to ||
            (item.to !== '/incidents' && location.pathname.startsWith(item.to));

          if (!isGroup) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex h-10 items-center gap-3 rounded-lg text-sm font-semibold transition-colors',
                    collapsed ? 'justify-center px-0' : 'px-3',
                    isActive
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          }

          return (
            <div key={item.to}>
              <button
                onClick={() =>
                  collapsed
                    ? onToggle()
                    : setOpenGroups((g) => ({ ...g, [item.label]: !groupOpen }))
                }
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex h-10 w-full items-center gap-3 rounded-lg text-sm font-semibold transition-colors',
                  collapsed ? 'justify-center px-0' : 'px-3',
                  active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform', groupOpen && 'rotate-180')}
                    />
                  </>
                )}
              </button>
              {!collapsed && groupOpen && (
                <div className="mt-1 ml-4 space-y-0.5 border-l border-white/20 pl-3">
                  {item.children!.map((child) => {
                    const count = child.badgeKey ? badges[child.badgeKey] : undefined;
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end
                        className={({ isActive }) =>
                          cn(
                            'flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors',
                            isActive
                              ? 'bg-white text-brand font-semibold shadow-sm'
                              : 'text-white/75 hover:bg-white/10 hover:text-white',
                          )
                        }
                      >
                        <span className="min-w-0 flex-1 truncate">{child.label}</span>
                        {typeof count === 'number' && count > 0 && (
                          <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-white/15 px-1.5 text-2xs font-bold tabular-nums text-white">
                            {count}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/15 p-2.5">
        {!collapsed && (
          <div className="mb-2 rounded-lg border border-white/15 bg-white/10 p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-extrabold text-brand">
                {initialsFor(user.nombre)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-white">{user.nombre}</p>
                <p className="truncate text-2xs font-semibold text-white/60">{ROLE_LABELS[user.rol]}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-2xs font-bold uppercase tracking-wide text-white/60">
              <UserCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{sourceLabel(sessionSource)}</span>
            </div>
          </div>
        )}

        <button
          onClick={onReturnToLauncher}
          className={cn(
            'mb-1 flex h-10 w-full items-center gap-3 rounded-lg text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
          title="Volver al launcher"
        >
          <LayoutGrid className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Launcher</span>}
        </button>

        <button
          onClick={onLogout}
          className={cn(
            'mb-1 flex h-10 w-full items-center gap-3 rounded-lg text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
          title="Cerrar sesion"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Cerrar sesion</span>}
        </button>

        <button
          onClick={onToggle}
          className={cn(
            'flex h-10 w-full items-center gap-3 rounded-lg text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronLeft
            className={cn('h-[18px] w-[18px] shrink-0 transition-transform', collapsed && 'rotate-180')}
          />
          {!collapsed && <span className="truncate">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
