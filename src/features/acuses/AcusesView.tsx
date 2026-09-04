import { useMemo } from 'react';
import { useSession } from '@/store/session';

/**
 * Apartado Acuses — embebe el proyecto ACUSE original (tal cual) servido desde
 * /public/acuse, en modo embed (sin su propio sidebar/topbar). El adaptador
 * acuse-api.js lo conecta a Supabase; la config viaja por query string.
 */
export function AcusesView() {
  const { user } = useSession();

  const src = useMemo(() => {
    const url = import.meta.env.VITE_ACUSE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_ACUSE_SUPABASE_ANON_KEY as string | undefined;
    const p = new URLSearchParams();
    if (url) p.set('sb', url);
    if (key) p.set('key', key);
    p.set('user', user?.nombre ?? 'Operador General');
    // App ACUSE completa (dashboard + gestión + su propia navegación).
    return `/acuse/views/dashboard-Acuses.html?${p.toString()}`;
  }, [user]);

  return (
    <div className="h-full w-full">
      <iframe
        src={src}
        title="Acuses"
        className="h-full w-full border-0 block"
        allow="clipboard-write"
      />
    </div>
  );
}
