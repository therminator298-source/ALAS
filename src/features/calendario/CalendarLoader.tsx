import { ListChecks } from 'lucide-react';

/** Loader discreto que vive dentro de la lista sin tapar el Calendario. */
export function CalendarLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando tareas"
      className="flex min-h-[210px] flex-col items-center justify-center px-6 py-10 text-center"
    >
      <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand shadow-[0_8px_22px_rgba(20,120,184,0.14)]">
        <span className="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent border-r-sky-400 border-t-brand motion-reduce:animate-none" />
        <ListChecks className="h-6 w-6" strokeWidth={2.3} />
      </span>
      <p className="mt-4 text-sm font-extrabold text-ink">Cargando tareas</p>
      <span className="mt-2 h-1 w-20 overflow-hidden rounded-full bg-brand-soft" aria-hidden="true">
        <span className="block h-full w-1/2 animate-pulse rounded-full bg-brand motion-reduce:animate-none" />
      </span>
    </div>
  );
}
