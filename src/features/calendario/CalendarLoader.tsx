import { CalendarDays, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Pantalla de arranque del Calendario, compartida por sesión y primera carga. */
export function CalendarLoader({ shell = false }: { shell?: boolean }) {
  const content = (
    <div className="relative grid min-h-full flex-1 place-items-center overflow-hidden bg-gradient-to-b from-brand-soft/50 via-white to-sky-50 px-5">
      <span className="pointer-events-none absolute -left-20 top-1/4 h-56 w-56 rounded-full bg-sky-300/15 blur-3xl" />
      <span className="pointer-events-none absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />

      <section
        role="status"
        aria-live="polite"
        aria-label="Cargando tareas"
        className="relative w-full max-w-[340px] overflow-hidden rounded-[28px] border border-brand/10 bg-white/95 px-7 py-9 text-center shadow-[0_22px_60px_rgba(8,72,106,0.16)] ring-1 ring-white"
      >
        <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-brand/5" />

        <div className="relative mx-auto h-24 w-24">
          <span className="absolute inset-0 rounded-full border-[3px] border-brand/10" />
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-r-sky-400 border-t-brand motion-reduce:animate-none" />
          <span className="absolute inset-3 animate-pulse rounded-full bg-gradient-to-br from-[#1478b8] to-brand shadow-[0_10px_28px_rgba(20,120,184,0.32)] motion-reduce:animate-none" />
          <span className="absolute inset-3 grid place-items-center text-white">
            <CalendarDays className="h-9 w-9" strokeWidth={2.2} />
          </span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-brand">
          <ListChecks className="h-4 w-4" strokeWidth={2.4} />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em]">Calendario ALAS</p>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Cargando tareas</h1>
        <p className="mt-1.5 text-sm font-medium text-ink-3">Preparando tu calendario de trabajo…</p>

        <div className="mx-auto mt-6 flex w-14 items-center justify-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                'h-2 w-2 animate-bounce rounded-full bg-brand motion-reduce:animate-none',
                i === 1 && '[animation-delay:150ms]',
                i === 2 && '[animation-delay:300ms]',
              )}
            />
          ))}
        </div>
      </section>
    </div>
  );

  if (!shell) return content;
  return (
    <div className="alas-model-layout">
      <div className="alas-model-shell">{content}</div>
    </div>
  );
}
