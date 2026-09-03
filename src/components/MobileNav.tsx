import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/incidents', label: 'Incidencias', icon: ClipboardList, end: false },
];

/** Navegación inferior para móvil (oculta en ≥ md). */
export function MobileNav() {
  const itemCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-col items-center justify-center gap-0.5 text-2xs font-semibold transition-colors',
      isActive ? 'text-brand' : 'text-ink-3',
    );

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface border-t border-border grid grid-cols-2 pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink key={it.to} to={it.to} className={itemCls} end={it.end}>
            <Icon className="h-5 w-5" strokeWidth={2} />
            {it.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
