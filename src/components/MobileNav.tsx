import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Plus, FileBarChart, MoreHorizontal,
  Truck, Package, ShieldCheck, Settings, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/incidents', label: 'Incidencias', icon: ClipboardList },
  { to: '/reports', label: 'Reportes', icon: FileBarChart },
];

const MORE = [
  { to: '/suppliers', label: 'Proveedores', icon: Truck },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/audit', label: 'Auditoría', icon: ShieldCheck },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

/** Navegación inferior para móvil (oculta en ≥ md). */
export function MobileNav() {
  const navigate = useNavigate();
  const [more, setMore] = useState(false);

  const itemCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-col items-center justify-center gap-0.5 text-2xs font-semibold transition-colors',
      isActive ? 'text-brand' : 'text-ink-3',
    );

  return (
    <>
      {/* Sheet "Más" */}
      {more && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMore(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 right-0 bottom-16 bg-surface border-t border-border rounded-t-2xl p-3 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-sm font-extrabold text-ink">Más opciones</span>
              <button onClick={() => setMore(false)} aria-label="Cerrar" className="text-ink-3">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.to}
                    onClick={() => { setMore(false); navigate(m.to); }}
                    className="flex items-center gap-3 h-12 px-3 rounded-xl bg-surface-3 text-ink-2 font-semibold"
                  >
                    <Icon className="h-5 w-5 text-ink-3" /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface border-t border-border grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {PRIMARY.slice(0, 2).map((it) => {
          const Icon = it.icon;
          return (
            <NavLink key={it.to} to={it.to} className={itemCls} end={it.to === '/dashboard'}>
              <Icon className="h-5 w-5" strokeWidth={2} />
              {it.label}
            </NavLink>
          );
        })}

        {/* Botón central: Nueva incidencia */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => navigate('/incidents/new')}
            className="grid place-items-center h-12 w-12 -mt-4 rounded-full bg-brand text-white shadow-pop"
            aria-label="Nueva incidencia"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        <NavLink to="/reports" className={itemCls}>
          <FileBarChart className="h-5 w-5" strokeWidth={2} />
          Reportes
        </NavLink>
        <button onClick={() => setMore(true)} className={cn('flex flex-col items-center justify-center gap-0.5 text-2xs font-semibold', more ? 'text-brand' : 'text-ink-3')}>
          <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
          Más
        </button>
      </nav>
    </>
  );
}
