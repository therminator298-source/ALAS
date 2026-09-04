import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Warehouse, Clock, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { listTareas } from './calendarioApi';
import { TareaFormModal } from './TareaFormModal';
import { estadoKey, DEPOSITOS, type Tarea } from './types';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const CHIP: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  en_curso: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  hecho: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
};
const DOT: Record<string, string> = { pendiente: 'bg-amber-400', en_curso: 'bg-blue-500', hecho: 'bg-emerald-500' };
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoOf(new Date());
const fmtDay = (iso: string) => { const d = new Date(`${iso}T00:00:00`); return d.toLocaleDateString('es-PY', { weekday: 'long', day: '2-digit', month: 'long' }); };

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
  const gridRef = useRef<HTMLDivElement>(null);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const total = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const start = new Date(cursor.y, cursor.m, 1 - startOffset);
    return Array.from({ length: total }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);

  useEffect(() => {
    if (cells.length === 0) return;
    let alive = true;
    listTareas(isoOf(cells[0]!), isoOf(cells[cells.length - 1]!), deposito).then((res) => {
      if (!alive) return; setTareas(res.rows); setLive(res.live);
    });
    return () => { alive = false; };
  }, [cells, deposito, reloadKey]);

  // Reset selección de día al cambiar de mes/depósito
  useEffect(() => { setSelectedDay(null); }, [cursor, deposito]);

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
      gsap.from('.cal-cell', { opacity: 0, y: 8, duration: 0.3, stagger: 0.006, ease: 'power2.out', clearProps: 'transform,opacity' });
    }, gridRef.current);
    return () => ctx.revert();
  }, [cells, deposito]);

  const reload = () => setReloadKey((k) => k + 1);
  const goMonth = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goToday = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); };
  const openNew = (fecha: string) => { setEditing(null); setFormFecha(fecha); setFormOpen(true); };
  const openEdit = (t: Tarea) => { setEditing(t); setFormOpen(true); };

  const tISO = todayISO();
  const listTasks = useMemo(() => {
    const rows = selectedDay ? tareas.filter((t) => t.fecha === selectedDay) : [...tareas];
    return rows.sort((a, b) => (a.fecha === b.fecha ? (a.hora ?? '99').localeCompare(b.hora ?? '99') : a.fecha.localeCompare(b.fecha)));
  }, [tareas, selectedDay]);

  return (
    <div className="p-5 md:p-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Calendario de tareas"
        subtitle="Planificación por depósito"
        actions={<button className="btn-primary" onClick={() => openNew(selectedDay ?? tISO)}><Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva tarea</button>}
      />

      {/* Botones de depósito */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {DEPOSITOS.map((d) => {
          const on = deposito === d;
          return (
            <button
              key={d}
              onClick={() => setDeposito(d)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 active:scale-[0.97]',
                on ? 'bg-brand text-white shadow-pop' : 'bg-surface-2 text-ink-2 border border-border hover:border-brand/40 hover:text-brand hover:-translate-y-px',
              )}
            >
              <Warehouse className="h-4 w-4" strokeWidth={2.2} /> {d}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-4">
        {/* ── Calendario (izquierda) ── */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <button className="btn-secondary h-9 w-9 p-0 justify-center" onClick={() => goMonth(-1)} aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></button>
            <button className="btn-secondary h-9 w-9 p-0 justify-center" onClick={() => goMonth(1)} aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></button>
            <h2 className="text-base font-extrabold text-ink capitalize ml-1">{MESES[cursor.m]} {cursor.y}</h2>
            <button className="btn-ghost h-9 ml-auto" onClick={goToday}>Hoy</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS.map((d) => <div key={d} className="text-2xs font-bold uppercase tracking-wide text-ink-3 text-center py-1">{d}</div>)}
          </div>
          <div ref={gridRef} className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const iso = isoOf(d);
              const inMonth = d.getMonth() === cursor.m;
              const isToday = iso === tISO;
              const isSel = iso === selectedDay;
              const dayTasks = byDate.get(iso) ?? [];
              const shown = dayTasks.slice(0, 2);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay((cur) => (cur === iso ? null : iso))}
                  className={cn(
                    'cal-cell text-left rounded-lg border p-1 min-h-[74px] transition-colors',
                    inMonth ? 'bg-surface border-border hover:border-brand/40' : 'bg-surface-2/40 border-transparent',
                    isToday && !isSel && 'ring-1 ring-brand/40',
                    isSel && 'ring-2 ring-brand border-brand/50',
                  )}
                >
                  <span className={cn('text-2xs font-bold tabular-nums', isToday ? 'grid place-items-center h-4 w-4 rounded-full bg-brand text-white' : inMonth ? 'text-ink-2' : 'text-ink-3/50')}>{d.getDate()}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {shown.map((t) => (
                      <div key={t.id} className="flex items-center gap-1 px-1 rounded text-[10px] font-semibold truncate" title={t.titulo}>
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', DOT[estadoKey(t.estado)])} />
                        <span className="truncate text-ink-2">{t.titulo}</span>
                      </div>
                    ))}
                    {dayTasks.length > shown.length && <div className="text-[10px] font-bold text-ink-3 px-1">+{dayTasks.length - shown.length}</div>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-2xs font-semibold text-ink-3 inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {live ? 'Datos en vivo · Supabase' : 'Vista previa · datos de ejemplo (creá el Supabase del Calendario)'}
          </div>
        </div>

        {/* ── Lista de tareas (derecha) ── */}
        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-ink capitalize truncate">
                {selectedDay ? fmtDay(selectedDay) : `Tareas de ${MESES[cursor.m]}`}
              </div>
              <div className="text-2xs font-semibold text-ink-3">{listTasks.length} tarea{listTasks.length === 1 ? '' : 's'} · {deposito}</div>
            </div>
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="chip h-7 bg-surface-3 text-ink-2 shrink-0"><X className="h-3.5 w-3.5" /> Todo el mes</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border max-h-[62vh]">
            {listTasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-3">
                Sin tareas {selectedDay ? 'este día' : 'este mes'}.
                <button onClick={() => openNew(selectedDay ?? tISO)} className="block mx-auto mt-3 btn-secondary h-9"><Plus className="h-4 w-4" /> Agregar tarea</button>
              </div>
            ) : listTasks.map((t) => {
              const k = estadoKey(t.estado);
              return (
                <button key={t.id} onClick={() => openEdit(t)} className="w-full text-left px-4 py-2.5 hover:bg-surface-3 transition-colors flex items-start gap-3">
                  <div className="shrink-0 w-14 text-center">
                    <div className="text-xs font-bold text-ink tabular-nums">{new Date(`${t.fecha}T00:00:00`).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' })}</div>
                    <div className="text-2xs text-ink-3 inline-flex items-center gap-0.5">{t.hora ? <><Clock className="h-3 w-3" />{t.hora.slice(0, 5)}</> : '—'}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink truncate flex items-center gap-1.5">
                      {t.prioridad === 'ALTA' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
                      {t.titulo}
                    </div>
                    <div className="text-2xs text-ink-3 truncate">{t.responsable ?? 'Sin responsable'}</div>
                  </div>
                  <span className={cn('chip h-6 px-2 text-2xs font-bold shrink-0', CHIP[k])}>{k === 'en_curso' ? 'En curso' : k === 'hecho' ? 'Hecho' : 'Pendiente'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <TareaFormModal
        open={formOpen}
        tarea={editing}
        defaultFecha={formFecha}
        defaultDeposito={deposito}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); reload(); }}
      />
    </div>
  );
}
