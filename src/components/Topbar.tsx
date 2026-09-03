import { Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { APP_NAME } from '@/config/constants';

const CRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  incidents: 'Incidencias',
  new: 'Nueva',
  reports: 'Reportes',
  suppliers: 'Proveedores',
  products: 'Productos',
  audit: 'Auditoria',
  settings: 'Configuracion',
};

interface TopbarProps {
  notifCount?: number;
}

export function Topbar({ notifCount = 0 }: TopbarProps) {
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

      <button type="button" className="alas-model-icon-button relative ml-auto" aria-label="Notificaciones">
        <Bell className="h-[18px] w-[18px]" />
        {notifCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-faltante px-1 text-[10px] font-bold tabular-nums text-white">
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>
    </header>
  );
}
