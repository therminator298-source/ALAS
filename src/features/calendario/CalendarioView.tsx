import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Warehouse, Clock, X, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listTareas } from './calendarioApi';
import { TareaFormModal } from './TareaFormModal';
import { estadoKey, DEPOSITOS, type Tarea } from './types';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const CHIP: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  en_curso: 'bg-blue-100 text-blue-800',
  hecho: 'bg-emerald-100 text-emerald-700',
};
const BAR: Record<string, string> = { pendiente: 'bg-amber-400', en_curso: 'bg-blue-500', hecho: 'bg-emerald-500' };
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoOf(new Date());
const fmtDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-PY', { weekday: 'long', day: '2-digit', month: 'long' });
const estLabel = (k: string) => (k === 'en_curso' ? 'En curso' : k === 'hecho' ? 'Hecho' : 'Pendiente');

export function CalendarioView() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [deposito, setDeposito] = useState<string>(DEPOSITOS[0]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [live, setLive] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tarea | null>(null);
  const [formFecha, setFormFecha] = useState(todayISO());
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const total = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const start = new Date(cursor.y, cursor.m, 1 - startOffset);
    return Array.from({ length: total }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);
  const weeks = cells.length / 7;

  useEffect(() => {
    if (cells.length === 0) return;
    let alive = true;
    listTareas(isoOf(cells[0]!), isoOf(cells[cells.length - 1]!), deposito).then((res) => {
      if (!alive) return; setTareas(res.rows); setLive(res.live);
    });
    return () => { alive = false; };
  }, [cells, deposito, reloadKey]);

  useEffect(() => { setSelectedDay(null); }, [cursor, deposito]);

  const byDate = useMemo(() => {
    const m = new Map<string, Tarea[]>();
    tareas.forEach((t) => { const a = m.get(t.fecha) ?? []; a.push(t); m.set(t.fecha, a); });
    return m;
  }, [tareas]);

  const tISO = todayISO();
  const listTasks = useMemo(() => {
    const rows = selectedDay ? tareas.filter((t) => t.fecha === selectedDay) : [...tareas];
    return rows.sort((a, b) => (a.fecha === b.fecha ? (a.hora ?? '99').localeCompare(b.hora ?? '99') : a.fecha.localeCompare(b.fecha)));
  }, [tareas, selectedDay]);

  // GSAP: entrada de barras/tarjetas al montar
  useEffect(() => {
    if (!rootRef.current) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.dep-btn', { opacity: 0, y: -8, duration: 0.4, stagger: 0.06, ease: 'back.out(1.6)', clearProps: 'all' });
      gsap.from('.cal-panel', { opacity: 0, y: 16, duration: 0.5, stagger: 0.1, ease: 'power3.out', clearProps: 'all', delay: 0.05 });
    }, rootRef.current);
    return () => ctx.revert();
  }, []);

  // GSAP: celdas del calendario al cambiar mes/depósito
  useEffect(() => {
    if (!gridRef.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.cal-cell', { opacity: 0, scale: 0.94, y: 6, duration: 0.32, stagger: 0.004, ease: 'power2.out', clearProps: 'all' });
    }, gridRef.current);
    return () => ctx.revert();
  }, [cells, deposito]);

  // GSAP: filas de la lista al cambiar datos/selección
  useEffect(() => {
    if (!listRef.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.cal-row', { opacity: 0, x: 12, duration: 0.34, stagger: 0.03, ease: 'power2.out', clearProps: 'all' });
    }, listRef.current);
    return () => ctx.revert();
  }, [listTasks]);

  const reload = () => setReloadKey((k) => k + 1);
  const goMonth = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goToday = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); };
  const openNew = (fecha: string) => { setEditing(null); setFormFecha(fecha); setFormOpen(true); };
  const openEdit = (t: Tarea) => { setEditing(t); setFormOpen(true); };

  return (
    <div ref={rootRef} className="flex flex-col h-full p-4 md:p-5 gap-3">
      {/* Header propio del módulo */}
      <div className="shrink-0 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-brand" strokeWidth={2} />
          <div>
            <h1 className="text-xl font-extrabold text-ink leading-tight">Calendario de tareas</h1>
            <p className="text-2xs font-semibold text-ink-3">Planificación por depósito</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-1">
          {DEPOSITOS.map((d) => {
            const on = deposito === d;
            return (
              <button key={d} onClick={() => setDeposito(d)}
                className={cn('dep-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold transition-all duration-200 active:scale-[0.97]',
                  on ? 'bg-brand text-white shadow-pop' : 'bg-surface-2 text-ink-2 border border-border hover:border-brand/40 hover:text-brand hover:-translate-y-px')}>
                <Warehouse className="h-4 w-4" strokeWidth={2.2} /> {d}
              </button>
            );
          })}
        </div>
        <button className="btn-primary ml-auto" onClick={() => openNew(selectedDay ?? tISO)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva tarea
        </button>
      </div>

      {/* Cuerpo full-height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-4">
        {/* Calendario */}
        <div className="cal-panel card p-4 flex flex-col min-h-0">
          <div className="shrink-0 flex items-center gap-2 mb-3">
            <button className="btn-secondary h-9 w-9 p-0 justify-center" onClick={() => goMonth(-1)} aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></button>
            <button className="btn-secondary h-9 w-9 p-0 justify-center" onClick={() => goMonth(1)} aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></button>
            <h2 className="text-lg font-extrabold text-ink capitalize ml-1">{MESES[cursor.m]} {cursor.y}</h2>
            <button className="btn-ghost h-9 ml-auto" onClick={goToday}>Hoy</button>
          </div>
          <div className="shrink-0 grid grid-cols-7 gap-1.5 mb-1.5">
            {DIAS.map((d) => <div key={d} className="text-2xs font-bold uppercase tracking-wide text-ink-3 text-center">{d}</div>)}
          </div>
          <div ref={gridRef} className="flex-1 min-h-0 grid grid-cols-7 gap-1.5" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
            {cells.map((d, i) => {
              const iso = isoOf(d);
              const inMonth = d.getMonth() === cursor.m;
              const isToday = iso === tISO;
              const isSel = iso === selectedDay;
              const dayTasks = byDate.get(iso) ?? [];
              const shown = dayTasks.slice(0, 3);
              return (
                <button key={i} onClick={() => setSelectedDay((cur) => (cur === iso ? null : iso))}
                  className={cn('cal-cell flex flex-col text-left rounded-xl border p-1.5 overflow-hidden transition-colors',
                    inMonth ? 'bg-surface border-border hover:border-brand/50 hover:bg-surface-3/40' : 'bg-surface-2/30 border-transparent',
                    isToday && !isSel && 'ring-1 ring-brand/40',
                    isSel && 'ring-2 ring-brand border-brand/50 bg-brand-soft/40')}>
                  <span className={cn('text-xs font-bold tabular-nums shrink-0', isToday ? 'grid place-items-center h-5 w-5 rounded-full bg-brand text-white' : inMonth ? 'text-ink-2' : 'text-ink-3/50')}>{d.getDate()}</span>
                  <div className="mt-1 flex-1 min-h-0 space-y-1 overflow-hidden">
                    {shown.map((t) => {
                      const k = estadoKey(t.estado);
                      return (
                        <div key={t.id} className={cn('flex items-center gap-1 pl-1 pr-1 py-0.5 rounded-md text-[11px] font-semibold truncate', CHIP[k])} title={t.titulo}>
                          <span className={cn('h-2.5 w-1 rounded-full shrink-0', BAR[k])} />
                          {t.hora && <span className="opacity-70 shrink-0">{t.hora.slice(0, 5)}</span>}
                          <span className="truncate">{t.titulo}</span>
                        </div>
                      );
                    })}
                    {dayTasks.length > shown.length && <div className="text-[10px] font-bold text-ink-3 pl-1">+{dayTasks.length - shown.length} más</div>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="shrink-0 mt-2 text-2xs font-semibold text-ink-3 inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {live ? 'Datos en vivo · Supabase' : 'Vista previa · datos de ejemplo (creá el Supabase del Calendario)'}
          </div>
        </div>

        {/* Lista de tareas */}
        <div className="cal-panel card overflow-hidden flex flex-col min-h-0">
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <div className="min-w-0 flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-brand shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-ink capitalize truncate">{selectedDay ? fmtDay(selectedDay) : `Tareas de ${MESES[cursor.m]}`}</div>
                <div className="text-2xs font-semibold text-ink-3 truncate">{listTasks.length} tarea{listTasks.length === 1 ? '' : 's'} · {deposito}</div>
              </div>
            </div>
            {selectedDay && <button onClick={() => setSelectedDay(null)} className="chip h-7 bg-surface-3 text-ink-2 shrink-0"><X className="h-3.5 w-3.5" /> Mes</button>}
          </div>
          <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto divide-y divide-border">
            {listTasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-3">
                Sin tareas {selectedDay ? 'este día' : 'este mes'} en {deposito}.
                <button onClick={() => openNew(selectedDay ?? tISO)} className="block mx-auto mt-3 btn-secondary h-9"><Plus className="h-4 w-4" /> Agregar tarea</button>
              </div>
            ) : listTasks.map((t) => {
              const k = estadoKey(t.estado);
              return (
                <button key={t.id} onClick={() => openEdit(t)} className="cal-row w-full text-left px-4 py-3 hover:bg-surface-3 transition-colors flex items-start gap-3 relative">
                  <span className={cn('absolute left-0 top-2 bottom-2 w-1 rounded-r', BAR[k])} />
                  <div className="shrink-0 w-12 text-center pl-1">
                    <div className="text-sm font-extrabold text-ink tabular-nums leading-none">{new Date(`${t.fecha}T00:00:00`).getDate()}</div>
                    <div className="text-2xs font-bold uppercase text-ink-3">{MESES[new Date(`${t.fecha}T00:00:00`).getMonth()]?.slice(0, 3)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink truncate flex items-center gap-1.5">
                      {t.prioridad === 'ALTA' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
                      {t.titulo}
                    </div>
                    <div className="text-2xs text-ink-3 truncate flex items-center gap-2 mt-0.5">
                      {t.hora && <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" />{t.hora.slice(0, 5)}</span>}
                      <span className="truncate">{t.responsable ?? 'Sin responsable'}</span>
                    </div>
                  </div>
                  <span className={cn('chip h-6 px-2 text-2xs font-bold shrink-0', CHIP[k])}>{estLabel(k)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <TareaFormModal open={formOpen} tarea={editing} defaultFecha={formFecha} defaultDeposito={deposito}
        onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload(); }} />
    </div>
  );
}
