import { NavLink } from 'react-router-dom';
import { CalendarDays, FileText, ClipboardList } from 'lucide-react';
import { useSession } from '@/store/session';
import { cn } from '@/lib/utils';

// Mismos 3 módulos que el sidebar de escritorio.
const ITEMS = [
  { to: '/calendario', label: 'Calendario', icon: CalendarDays, end: true },
  { to: '/acuses', label: 'Acuses', icon: FileText, end: false },
  { to: '/incidents', label: 'Incidencias', icon: ClipboardList, end: false },
];

const CALENDAR_ITEMS = [
  { to: '/calendario', label: 'Calendario', icon: CalendarDays, end: true },
];

/** Navegación inferior para móvil (oculta en ≥ md). */
export function MobileNav() {
  const { user } = useSession();
  const items = user.rol === 'CALENDARIO' ? CALENDAR_ITEMS : ITEMS;
  const itemCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-col items-center justify-center gap-0.5 text-2xs font-semibold transition-colors',
      isActive ? 'text-brand' : 'text-ink-3',
    );

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-[calc(4rem+env(safe-area-inset-bottom))] bg-surface border-t border-border grid pb-[env(safe-area-inset-bottom)]"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it) => {
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
