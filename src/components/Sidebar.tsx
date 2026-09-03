import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { NAV } from '@/config/nav';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  badges?: Partial<Record<'pendientes' | 'revision' | 'verificados', number>>;
}

export function Sidebar({ collapsed, onToggle, badges = {} }: SidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Incidencias: true });

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 border-r border-border bg-surface transition-[width] duration-300 ease-smooth',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-border">
        <div className="grid place-items-center h-9 w-9 shrink-0 rounded-lg bg-brand text-white font-extrabold">
          A
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-extrabold leading-tight text-ink">Incidencias</div>
            <div className="text-2xs font-semibold uppercase tracking-wide text-ink-3">Recepción</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
                    'group flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-brand-soft text-brand'
                      : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
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
                  'w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-semibold transition-colors',
                  active ? 'text-brand' : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', groupOpen && 'rotate-180')}
                    />
                  </>
                )}
              </button>
              {!collapsed && groupOpen && (
                <div className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                  {item.children!.map((child) => {
                    const count = child.badgeKey ? badges[child.badgeKey] : undefined;
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors',
                            isActive
                              ? 'bg-brand-soft text-brand font-semibold'
                              : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
                          )
                        }
                      >
                        <span className="truncate flex-1">{child.label}</span>
                        {typeof count === 'number' && count > 0 && (
                          <span className="shrink-0 min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full bg-surface-3 text-2xs font-bold text-ink-2 tabular-nums">
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

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center gap-3 h-11 px-4 border-t border-border text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors"
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        <ChevronLeft
          className={cn('h-[18px] w-[18px] shrink-0 transition-transform', collapsed && 'rotate-180')}
        />
        {!collapsed && <span className="text-xs font-semibold">Colapsar</span>}
      </button>
    </aside>
  );
}
