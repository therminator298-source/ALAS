import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { listTareas } from './calendarioApi';
import { TareaFormModal } from './TareaFormModal';
import { estadoKey, type Tarea } from './types';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const CHIP: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  en_curso: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  hecho: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
};
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoOf(new Date());

export function CalendarioView() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [live, setLive] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tarea | null>(null);
  const [formFecha, setFormFecha] = useState(todayISO());
  const gridRef = useRef<HTMLDivElement>(null);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7; // Lun=0
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const total = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const start = new Date(cursor.y, cursor.m, 1 - startOffset);
    return Array.from({ length: total }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);

  useEffect(() => {
    if (cells.length === 0) return;
    let alive = true;
    const fromISO = isoOf(cells[0]!); const toISO = isoOf(cells[cells.length - 1]!);
    listTareas(fromISO, toISO).then((res) => { if (!alive) return; setTareas(res.rows); setLive(res.live); });
    return () => { alive = false; };
  }, [cells, reloadKey]);

  const byDate = useMemo(() => {
    const m = new Map<string, Tarea[]>();
    tareas.forEach((t) => { const a = m.get(t.fecha) ?? []; a.push(t); m.set(t.fecha, a); });
    return m;
  }, [tareas]);

  useEffect(() => {
    if (!gridRef.current) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from('.cal-cell', { opacity: 0, y: 8, duration: 0.3, stagger: 0.008, ease: 'power2.out', clearProps: 'transform,opacity' });
    }, gridRef.current);
    return () => ctx.revert();
  }, [cells]);

  const reload = () => setReloadKey((k) => k + 1);
  const goMonth = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goToday = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); };
  const openNew = (fecha: string) => { setEditing(null); setFormFecha(fecha); setFormOpen(true); };
  const openEdit = (t: Tarea) => { setEditing(t); setFormOpen(true); };

  const total = tareas.length;
  const hechas = tareas.filter((t) => estadoKey(t.estado) === 'hecho').length;
  const tISO = todayISO();

  return (
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Calendario de tareas"
        subtitle="Planificación mensual del equipo"
        actions={<button className="btn-primary" onClick={() => openNew(tISO)}><Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva tarea</button>}
      />

      {/* Navegador de mes */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <button className="btn-secondary h-9 w-9 p-0 justify-center" onClick={() => goMonth(-1)} aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></button>
          <button className="btn-secondary h-9 w-9 p-0 justify-center" onClick={() => goMonth(1)} aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <h2 className="text-lg font-extrabold text-ink capitalize min-w-[190px]">{MESES[cursor.m]} {cursor.y}</h2>
        <button className="btn-ghost h-9" onClick={goToday}>Hoy</button>
        <div className="ml-auto flex items-center gap-3 text-2xs font-semibold">
          <Legend cls="bg-amber-400" label="Pendiente" />
          <Legend cls="bg-blue-500" label="En curso" />
          <Legend cls="bg-emerald-500" label="Hecho" />
          <span className="text-ink-3 tabular-nums">{hechas}/{total} hechas</span>
        </div>
      </div>

      {/* Encabezados de día */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DIAS.map((d) => <div key={d} className="text-2xs font-bold uppercase tracking-wide text-ink-3 text-center py-1">{d}</div>)}
      </div>

      {/* Grilla */}
      <div ref={gridRef} className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          const iso = isoOf(d);
          const inMonth = d.getMonth() === cursor.m;
          const isToday = iso === tISO;
          const dayTasks = byDate.get(iso) ?? [];
          const shown = dayTasks.slice(0, 3);
          const extra = dayTasks.length - shown.length;
          return (
            <div
              key={i}
              onClick={() => openNew(iso)}
              className={cn(
                'cal-cell group relative rounded-xl border p-1.5 min-h-[104px] cursor-pointer transition-colors',
                inMonth ? 'bg-surface border-border hover:border-brand/40' : 'bg-surface-2/40 border-transparent',
                isToday && 'ring-2 ring-brand/40 border-brand/40',
              )}
            >
              <div className="flex items-center justify-between px-0.5">
                <span className={cn('text-xs font-bold tabular-nums', isToday ? 'grid place-items-center h-5 w-5 rounded-full bg-brand text-white' : inMonth ? 'text-ink-2' : 'text-ink-3/50')}>{d.getDate()}</span>
                <Plus className="h-3.5 w-3.5 text-ink-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-1 space-y-1">
                {shown.map((t) => {
                  const k = estadoKey(t.estado);
                  return (
                    <button
                      key={t.id}
                      onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                      className={cn('w-full flex items-center gap-1 text-left px-1.5 py-1 rounded-md text-2xs font-semibold truncate transition-colors', CHIP[k])}
                      title={`${t.hora ? t.hora + ' · ' : ''}${t.titulo}`}
                    >
                      {t.prioridad === 'ALTA' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
                      {t.hora && <span className="opacity-70 shrink-0">{t.hora.slice(0, 5)}</span>}
                      <span className="truncate">{t.titulo}</span>
                    </button>
                  );
                })}
                {extra > 0 && <div className="text-2xs font-bold text-ink-3 px-1.5">+{extra} más</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-2xs font-semibold text-ink-3 inline-flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" />
        {live ? 'Datos en vivo · Supabase' : 'Vista previa · datos de ejemplo (creá el Supabase del Calendario y corré calendario_schema.sql)'}
      </div>

      <TareaFormModal open={formOpen} tarea={editing} defaultFecha={formFecha} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload(); }} />
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5 text-ink-3"><span className={cn('h-2 w-2 rounded-full', cls)} />{label}</span>;
}
