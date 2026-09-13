import { useSyncExternalStore } from 'react';

const cache = new Map<string, MediaQueryList>();

function mql(query: string): MediaQueryList {
  let m = cache.get(query);
  if (!m) { m = window.matchMedia(query); cache.set(query, m); }
  return m;
}

/**
 * Suscripción a una media query. Se usa para elegir el árbol móvil o el de
 * escritorio en tiempo de ejecución, en vez de renderizar los dos y ocultar uno
 * con `hidden lg:block`: con drag & drop, dos árboles montados registran los
 * mismos ids dos veces y dnd-kit se confunde.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = mql(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => mql(query).matches,
    () => false, // SSR / primer render: asumimos escritorio
  );
}

/** Teléfono o cualquier pantalla táctil: ahí va la tarjeta con gestos. */
export const TOUCH_QUERY = '(max-width: 767px), (pointer: coarse)';
