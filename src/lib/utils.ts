/** Une clases condicionalmente (mini clsx, sin dependencia). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Formatea fecha/hora regional (Paraguay). Ver [[paraguay_timezone]]: PY es UTC-3. */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  /* Una fecha sola ('2026-09-07', como vienen las columnas `date` de Postgres)
     la trata el navegador como medianoche UTC, asi que en Paraguay (UTC-3) caia
     en el dia anterior: 06/09/2026. Se arma como fecha local. Los timestamps
     con hora y zona siguen el camino de siempre. */
  const sola = /^\d{4}-\d{2}-\d{2}$/.exec(iso);
  const d = sola
    ? new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Antigüedad legible: "3h 14m", "2 días". */
export function fmtAge(fromIso: string, toIso?: string): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((to - from) / 60000));
  const days = Math.floor(mins / 1440);
  if (days >= 1) return days === 1 ? '1 día' : `${days} días`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Horas transcurridas desde una fecha ISO. */
export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}
