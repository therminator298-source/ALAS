import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Warehouse, Factory, Building2, Clock, X, ListTodo, Search, User, Users, ChevronDown, CalendarX2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SegStrip } from '@/components/SegStrip';
import { listTareas, changeEstadoTarea, updateTarea } from './calendarioApi';
import { TareaFormModal } from './TareaFormModal';
import { estadoKey, DEPOSITOS, type Tarea } from './types';

const DEP_ICON: Record<string, LucideIcon> = {
  'Depósito Central': Warehouse,
  'Fábrica': Factory,
  'Depósito Luque Sanber': Building2,
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_CORTO = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const CHIP: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  en_curso: 'bg-blue-100 text-blue-700',
  hecho: 'bg-emerald-100 text-emerald-700',
};
const BAR: Record<string, string> = { pendiente: 'bg-amber-400', en_curso: 'bg-blue-500', hecho: 'bg-emerald-500' };
const EST_FILTERS: { k: string; label: string }[] = [
  { k: 'all', label: 'Todas' }, { k: 'pendiente', label: 'Pend.' }, { k: 'en_curso', label: 'Curso' }, { k: 'hecho', label: 'Hecho' },
];
const EST_ACTIVE: Record<string, string> = { all: 'bg-gradient-to-br from-[#1478b8] to-brand text-white', pendiente: 'bg-amber-500 text-white', en_curso: 'bg-blue-600 text-white', hecho: 'bg-emerald-600 text-white' };
const NEXT_ESTADO: Record<string, string> = { pendiente: 'En curso', en_curso: 'Hecho', hecho: 'Pendiente' };

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoOf(new Date());
const fmtDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-PY', { weekday: 'long', day: '2-digit', month: 'long' });
const estLabel = (k: string) => (k === 'en_curso' ? 'En curso' : k === 'hecho' ? 'Hecho' : 'Pendiente');
const norm = (s: string | null | undefined) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const reduceMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

export function CalendarioView() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [deposito, setDeposito] = useState<string>(DEPOSITOS[0]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tarea | null>(null);
  const [formFecha, setFormFecha] = useState(todayISO());
  const [fEstado, setFEstado] = useState('all');
  const [fResp, setFResp] = useState('');
  const [fSearch, setFSearch] = useState('');
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [tip, setTip] = useState<{ iso: string; rect: DOMRect } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const total = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const start = new Date(cursor.y, cursor.m, 1 - startOffset);
    return Array.from({ length: total }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);
  const weeks = cells.length / 7;
  const monthDays = useMemo(() => cells.filter((d) => d.getMonth() === cursor.m), [cells, cursor.m]);

  useEffect(() => {
    if (cells.length === 0) return;
    let alive = true;
    listTareas(isoOf(cells[0]!), isoOf(cells[cells.length - 1]!)).then((res) => {
      if (!alive) return; setTareas(res.rows);
    });
    return () => { alive = false; };
  }, [cells, reloadKey]);

  useEffect(() => { setSelectedDay(null); setFResp(''); }, [cursor, deposito]);

  const depTareas = useMemo(() => tareas.filter((t) => t.deposito === deposito), [tareas, deposito]);
  const depCounts = useMemo(() => {
    const c: Record<string, number> = {};
    DEPOSITOS.forEach((d) => { c[d] = 0; });
    tareas.forEach((t) => { const d = t.deposito; if (d && d in c) c[d] = (c[d] ?? 0) + 1; });
    return c;
  }, [tareas]);

  const byDate = useMemo(() => {
    const m = new Map<string, Tarea[]>();
    depTareas.forEach((t) => { const a = m.get(t.fecha) ?? []; a.push(t); m.set(t.fecha, a); });
    return m;
  }, [depTareas]);

  const resps = useMemo(() => {
    const s = new Set<string>();
    depTareas.forEach((t) => { if (t.responsable) s.add(t.responsable); });
    return Array.from(s).sort();
  }, [depTareas]);

  const tISO = todayISO();
  const listTasks = useMemo(() => {
    let rows = selectedDay ? depTareas.filter((t) => t.fecha === selectedDay) : [...depTareas];
    if (fEstado !== 'all') rows = rows.filter((t) => estadoKey(t.estado) === fEstado);
    if (fResp) rows = rows.filter((t) => (t.responsable ?? '') === fResp);
    const term = norm(fSearch).trim();
    if (term) rows = rows.filter((t) => norm(t.titulo).includes(term) || norm(t.responsable).includes(term) || norm(t.descripcion).includes(term));
    return rows.sort((a, b) => (a.fecha === b.fecha ? (a.hora ?? '99').localeCompare(b.hora ?? '99') : a.fecha.localeCompare(b.fecha)));
  }, [depTareas, selectedDay, fEstado, fResp, fSearch]);
  const filtersActive = fEstado !== 'all' || !!fResp || fSearch.trim() !== '';

  // GSAP: entrada de barras/tarjetas al montar
  useEffect(() => {
    if (!rootRef.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.dep-seg', { opacity: 0, y: -8, duration: 0.45, ease: 'back.out(1.6)', clearProps: 'all' });
      gsap.from('.cal-panel', { opacity: 0, y: 18, duration: 0.55, stagger: 0.09, ease: 'power3.out', clearProps: 'all', delay: 0.05 });
    }, rootRef.current);
    return () => ctx.revert();
  }, []);

  // GSAP: celdas del calendario al cambiar mes/depósito
  useEffect(() => {
    if (!gridRef.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.cal-cell', { opacity: 0, scale: 0.94, y: 6, duration: 0.34, stagger: 0.004, ease: 'power2.out', clearProps: 'all' });
    }, gridRef.current);
    return () => ctx.revert();
  }, [cells, deposito]);

  // GSAP: riel de días (mobile) al cambiar mes/depósito
  useEffect(() => {
    if (!railRef.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.cal-daypill', { opacity: 0, y: 10, duration: 0.3, stagger: 0.02, ease: 'power2.out', clearProps: 'all' });
    }, railRef.current);
    return () => ctx.revert();
  }, [cells, deposito]);

  // GSAP: filas de la lista al cambiar de contexto (no en cada cambio de estado)
  useEffect(() => {
    if (!listRef.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.cal-row', { opacity: 0, x: 14, duration: 0.36, stagger: 0.035, ease: 'power2.out', clearProps: 'all' });
    }, listRef.current);
    return () => ctx.revert();
  }, [selectedDay, deposito, cursor.m, cursor.y, fEstado, fResp, fSearch]);

  // GSAP: empty state al aparecer
  useEffect(() => {
    if (listTasks.length !== 0 || !emptyRef.current || reduceMotion()) return;
    gsap.from(emptyRef.current.children, { opacity: 0, y: 12, scale: 0.96, duration: 0.4, stagger: 0.07, ease: 'back.out(1.6)', clearProps: 'all' });
  }, [listTasks.length, filtersActive, selectedDay, deposito]);

  const reload = () => setReloadKey((k) => k + 1);
  const goMonth = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goToday = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); };
  const openNew = (fecha: string) => { setEditing(null); setFormFecha(fecha); setFormOpen(true); };
  const openEdit = (t: Tarea) => { setEditing(t); setFormOpen(true); };
  const toggleDay = (iso: string) => setSelectedDay((cur) => (cur === iso ? null : iso));

  const cycleEstado = async (t: Tarea) => {
    const next = NEXT_ESTADO[estadoKey(t.estado)] ?? 'En curso';
    setTareas((prev) => prev.map((x) => (x.id === t.id ? { ...x, estado: next } : x)));
    try { await changeEstadoTarea(t.id, next); } catch { reload(); }
  };
  const moveTarea = async (id: number, fecha: string) => {
    const cur = tareas.find((x) => x.id === id);
    if (!cur || cur.fecha === fecha) return;
    setTareas((prev) => prev.map((x) => (x.id === id ? { ...x, fecha } : x)));
    if (!reduceMotion()) requestAnimationFrame(() => {
      const el = gridRef.current?.querySelector(`[data-iso="${fecha}"]`);
      if (el) gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: 'back.out(2.2)' });
    });
    try { await updateTarea(id, { fecha }); } catch { reload(); }
  };

  return (
    <div ref={rootRef} className="flex flex-col h-full p-3 md:p-5 gap-3 bg-gradient-to-b from-brand-soft/25 to-transparent">
      {/* Header propio del módulo */}
      <div className="shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-[#1478b8] to-brand text-white shadow-[0_6px_16px_rgba(20,120,184,0.35)]">
            <CalendarDays className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="hidden sm:block">
            <h1 className="text-xl font-extrabold text-ink leading-tight">Calendario de tareas</h1>
            <p className="text-2xs font-semibold text-ink-3">Planificación por depósito</p>
          </div>
        </div>
        <div className="dep-seg flex-1 flex justify-center min-w-0 overflow-x-auto">
          <SegStrip
            equal
            className="w-full max-w-[620px]"
            items={DEPOSITOS.map((d) => ({ value: d, label: d, icon: DEP_ICON[d] ?? Warehouse, count: depCounts[d] ?? 0 }))}
            value={deposito}
            onChange={setDeposito}
          />
        </div>
        <button className="btn-primary shrink-0 hidden sm:inline-flex bg-gradient-to-br from-[#1478b8] to-brand" onClick={() => openNew(tISO)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva tarea
        </button>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 lg:gap-4">
        {/* ── Calendario mensual (desktop / tablet grande) ── */}
        <div className="cal-panel card p-0 hidden lg:flex flex-col min-h-0 overflow-hidden ring-1 ring-brand/10">
          <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1478b8] to-brand text-white shadow-[0_2px_10px_rgba(20,120,184,0.25)]">
            <button className="h-9 w-9 p-0 grid place-items-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors" onClick={() => goMonth(-1)} aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></button>
            <button className="h-9 w-9 p-0 grid place-items-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors" onClick={() => goMonth(1)} aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></button>
            <h2 className="text-lg font-extrabold text-white capitalize ml-1">{MESES[cursor.m]} <span className="text-white/75">{cursor.y}</span></h2>
            <button className="h-9 ml-auto px-3.5 rounded-lg font-bold text-white bg-white/15 hover:bg-white/25 transition-colors" onClick={goToday}>Hoy</button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col p-3">
            <div className="shrink-0 grid grid-cols-7 gap-1.5 mb-1.5 rounded-lg bg-brand-soft/40 py-1.5">
              {DIAS.map((d) => <div key={d} className="text-2xs font-bold uppercase tracking-wide text-brand/70 text-center">{d}</div>)}
            </div>
            <div ref={gridRef} className="flex-1 min-h-0 grid grid-cols-7 gap-1.5" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
              {cells.map((d, i) => {
                const iso = isoOf(d);
                const inMonth = d.getMonth() === cursor.m;
                const isToday = iso === tISO;
                const isSel = iso === selectedDay;
                const isOver = dragOver === iso;
                const wknd = isWeekend(d);
                const dayTasks = byDate.get(iso) ?? [];
                const shown = dayTasks.slice(0, 3);
                return (
                  <div
                    key={i}
                    data-iso={iso}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleDay(iso)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDay(iso); } }}
                    onDragOver={(e) => { if (dragId != null) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver !== iso) setDragOver(iso); } }}
                    onDrop={(e) => { e.preventDefault(); const id = Number(e.dataTransfer.getData('text/plain')); setDragOver(null); setDragId(null); if (id) moveTarea(id, iso); }}
                    onMouseEnter={(e) => { if (dayTasks.length && dragId == null) setTip({ iso, rect: e.currentTarget.getBoundingClientRect() }); }}
                    onMouseLeave={() => setTip((t) => (t?.iso === iso ? null : t))}
                    className={cn('cal-cell group relative flex flex-col text-left rounded-xl border p-1.5 overflow-hidden transition-all cursor-pointer',
                      inMonth ? (wknd ? 'bg-brand-soft/20 border-border' : 'bg-surface border-border') : 'bg-surface-2/30 border-transparent',
                      inMonth && 'hover:border-brand/60 hover:shadow-[0_6px_18px_rgba(20,120,184,0.12)]',
                      isToday && !isSel && 'ring-1 ring-brand/40',
                      isSel && 'ring-2 ring-brand border-brand/50 bg-brand-soft/50',
                      isOver && 'ring-2 ring-brand border-brand bg-brand-soft/70 scale-[1.02]')}>
                    <div className="flex items-center justify-between shrink-0">
                      <span className={cn('text-xs font-bold tabular-nums', isToday ? 'grid place-items-center h-5 w-5 rounded-full bg-gradient-to-br from-[#1478b8] to-brand text-white shadow-sm' : inMonth ? 'text-ink-2' : 'text-ink-3/50')}>{d.getDate()}</span>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Nueva tarea este día"
                        onClick={(e) => { e.stopPropagation(); openNew(iso); }}
                        className="h-5 w-5 grid place-items-center rounded-md bg-gradient-to-br from-[#1478b8] to-brand text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 hover:scale-110">
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
                      </button>
                    </div>
                    <div className="mt-1 flex-1 min-h-0 space-y-1 overflow-hidden">
                      {shown.map((t) => {
                        const k = estadoKey(t.estado);
                        return (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); setDragId(t.id); e.dataTransfer.setData('text/plain', String(t.id)); e.dataTransfer.effectAllowed = 'move'; }}
                            onDragEnd={() => { setDragId(null); setDragOver(null); }}
                            onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                            className={cn('flex items-center gap-1 pl-1 pr-1 py-0.5 rounded-md text-[11px] font-semibold truncate cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm', CHIP[k], dragId === t.id && 'opacity-40')}
                            title={`${t.titulo} — arrastrá para reprogramar`}>
                            <span className={cn('h-2.5 w-1 rounded-full shrink-0', BAR[k])} />
                            {t.hora && <span className="opacity-70 shrink-0">{t.hora.slice(0, 5)}</span>}
                            <span className="truncate">{t.titulo}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > shown.length && <div className="text-[10px] font-bold text-brand pl-1">+{dayTasks.length - shown.length} más</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Riel de días horizontal (mobile / tablet) ── */}
        <div className="cal-panel card lg:hidden shrink-0 p-3 flex flex-col gap-2 ring-1 ring-brand/10">
          <div className="flex items-center gap-2">
            <button className="btn-secondary h-8 w-8 p-0 justify-center" onClick={() => goMonth(-1)} aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></button>
            <h2 className="text-base font-extrabold text-ink capitalize">{MESES[cursor.m]} <span className="text-brand">{cursor.y}</span></h2>
            <button className="btn-secondary h-8 w-8 p-0 justify-center" onClick={() => goMonth(1)} aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></button>
            <button className="btn-ghost h-8 ml-auto text-brand font-bold px-3" onClick={goToday}>Hoy</button>
          </div>
          <div ref={railRef} className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 snap-x">
            {monthDays.map((d) => {
              const iso = isoOf(d);
              const isToday = iso === tISO;
              const isSel = iso === selectedDay;
              const n = (byDate.get(iso) ?? []).length;
              return (
                <button
                  key={iso}
                  onClick={() => toggleDay(iso)}
                  onDragOver={(e) => { if (dragId != null) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(iso); } }}
                  onDrop={(e) => { e.preventDefault(); const id = Number(e.dataTransfer.getData('text/plain')); setDragOver(null); setDragId(null); if (id) moveTarea(id, iso); }}
                  className={cn('cal-daypill snap-start shrink-0 w-[52px] rounded-2xl border py-2 flex flex-col items-center gap-0.5 transition-all',
                    isSel ? 'bg-gradient-to-br from-[#1478b8] to-brand text-white border-brand shadow-[0_6px_16px_rgba(20,120,184,0.30)]' : 'bg-surface border-border hover:border-brand/50',
                    isToday && !isSel && 'ring-1 ring-brand/50', dragOver === iso && 'ring-2 ring-brand scale-105')}>
                  <span className={cn('text-[10px] font-bold uppercase', isSel ? 'text-white/80' : 'text-ink-3')}>{DIAS_CORTO[(d.getDay() + 6) % 7]}</span>
                  <span className={cn('text-lg font-extrabold tabular-nums leading-none', isSel ? 'text-white' : isToday ? 'text-brand' : 'text-ink')}>{d.getDate()}</span>
                  <span className={cn('h-1.5 w-1.5 rounded-full', n > 0 ? (isSel ? 'bg-white' : 'bg-brand') : 'bg-transparent')} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Lista de tareas ── */}
        <div className="cal-panel card overflow-hidden flex flex-col min-h-0 flex-1 ring-1 ring-brand/10">
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-[#1478b8] to-brand text-white shadow-[0_2px_10px_rgba(20,120,184,0.25)]">
            <div className="min-w-0 flex items-center gap-2">
              <span className="grid place-items-center h-8 w-8 rounded-lg bg-white/20 text-white shrink-0"><ListTodo className="h-4 w-4" /></span>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-white capitalize truncate">{selectedDay ? fmtDay(selectedDay) : `Tareas de ${MESES[cursor.m]}`}</div>
                <div className="text-2xs font-semibold text-white/70 truncate">{listTasks.length} tarea{listTasks.length === 1 ? '' : 's'} · {deposito}</div>
              </div>
            </div>
            {selectedDay && <button onClick={() => setSelectedDay(null)} className="chip h-7 bg-white/20 text-white shrink-0 font-bold hover:bg-white/30 transition-colors"><X className="h-3.5 w-3.5" /> Mes</button>}
          </div>

          {/* Barra de filtros */}
          <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-surface-2/40">
            <div className="relative flex-1 min-w-[130px]">
              <Search className="h-3.5 w-3.5 text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={fSearch} onChange={(e) => setFSearch(e.target.value)} placeholder="Buscar tarea o responsable…" className="input h-9 pl-8 text-sm w-full" />
            </div>
            <div className="inline-flex rounded-lg border border-border overflow-hidden shrink-0 bg-surface">
              {EST_FILTERS.map((f) => (
                <button key={f.k} onClick={() => setFEstado(f.k)}
                  className={cn('px-2.5 h-9 text-2xs font-bold border-l first:border-l-0 border-border transition-colors', fEstado === f.k ? EST_ACTIVE[f.k] : 'text-ink-2 hover:bg-surface-3')}>
                  {f.label}
                </button>
              ))}
            </div>
            {resps.length > 0 && <RespFilter value={fResp} options={resps} onChange={setFResp} />}
            {filtersActive && (
              <button onClick={() => { setFEstado('all'); setFResp(''); setFSearch(''); }} className="chip h-9 bg-surface-3 text-ink-2 shrink-0"><X className="h-3.5 w-3.5" /> Limpiar</button>
            )}
          </div>

          <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto divide-y divide-border">
            {listTasks.length === 0 ? (
              <div ref={emptyRef} className="p-10 flex flex-col items-center text-center gap-3">
                <span className="grid place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-soft to-brand-soft/40 text-brand ring-1 ring-brand/10 shadow-sm">
                  <CalendarX2 className="h-7 w-7" strokeWidth={1.8} />
                </span>
                <div>
                  <div className="text-sm font-extrabold text-ink">{filtersActive ? 'Sin coincidencias' : 'Sin tareas'}</div>
                  <div className="text-2xs font-semibold text-ink-3 mt-1 max-w-[220px]">
                    {filtersActive ? 'Probá con otros filtros o limpialos.' : `No hay tareas ${selectedDay ? 'este día' : 'este mes'} en ${deposito}.`}
                  </div>
                </div>
                <button onClick={() => openNew(selectedDay ?? tISO)} className="btn-primary h-9 bg-gradient-to-br from-[#1478b8] to-brand shadow-[0_6px_16px_rgba(20,120,184,0.30)]"><Plus className="h-4 w-4" strokeWidth={2.5} /> Agregar tarea</button>
              </div>
            ) : listTasks.map((t) => {
              const k = estadoKey(t.estado);
              return (
                <div key={t.id}
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={(e) => { setDragId(t.id); e.dataTransfer.setData('text/plain', String(t.id)); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragEnd={() => { setDragId(null); setDragOver(null); }}
                  onClick={() => openEdit(t)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openEdit(t); }}
                  className={cn('cal-row group w-full text-left px-4 py-3 hover:bg-brand-soft/30 transition-colors flex items-start gap-3 relative cursor-pointer', dragId === t.id && 'opacity-40')}>
                  <span className={cn('absolute left-0 top-2 bottom-2 w-1 rounded-r', BAR[k])} />
                  <div className="shrink-0 w-12 text-center pl-1">
                    <div className="text-sm font-extrabold text-brand tabular-nums leading-none">{new Date(`${t.fecha}T00:00:00`).getDate()}</div>
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
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); cycleEstado(t); if (!reduceMotion()) gsap.fromTo(e.currentTarget, { scale: 0.8 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }); }}
                    title="Tocá para cambiar el estado"
                    className={cn('chip h-6 px-2 text-2xs font-bold shrink-0 transition-colors cursor-pointer hover:brightness-95 active:scale-95', CHIP[k])}>
                    {estLabel(k)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAB (mobile): cargar tarea rápido */}
      <button
        onClick={() => openNew(tISO)}
        className="sm:hidden fixed bottom-6 right-5 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-[#1478b8] to-brand text-white grid place-items-center shadow-[0_10px_28px_rgba(20,120,184,0.45)] active:scale-95 transition-transform"
        aria-label="Nueva tarea">
        <Plus className="h-6 w-6" strokeWidth={2.6} />
      </button>

      {tip && <DayTooltip iso={tip.iso} rect={tip.rect} tasks={byDate.get(tip.iso) ?? []} />}

      <TareaFormModal open={formOpen} tarea={editing} defaultFecha={formFecha} defaultDeposito={deposito}
        onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); reload(); }} />
    </div>
  );
}

/** Tooltip PRO al pasar el cursor sobre un día: lista lo cargado esa fecha. */
function DayTooltip({ iso, rect, tasks }: { iso: string; rect: DOMRect; tasks: Tarea[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || reduceMotion()) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 10, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.24, ease: 'back.out(2.2)' });
  }, [iso]);

  const W = 268;
  const left = Math.max(8, Math.min(rect.left + rect.width / 2 - W / 2, window.innerWidth - W - 8));
  const below = rect.top < 240; // cerca del borde superior → mostrar abajo
  const pos: { top?: number; bottom?: number } = below
    ? { top: rect.bottom + 10 }
    : { bottom: window.innerHeight - rect.top + 10 };

  const shown = tasks.slice(0, 6);
  const k0 = tasks.reduce((a, t) => { const k = estadoKey(t.estado); a[k] = (a[k] ?? 0) + 1; return a; }, {} as Record<string, number>);

  return (
    <div ref={ref} style={{ position: 'fixed', left, width: W, zIndex: 60, pointerEvents: 'none', ...pos }}
      className="rounded-2xl border border-border bg-surface shadow-[0_18px_48px_rgba(15,36,64,0.22)] overflow-hidden">
      {/* Cabecera azul */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-r from-[#1478b8] to-brand text-white">
        <span className="text-2xs font-extrabold uppercase tracking-wide capitalize truncate">{fmtDay(iso)}</span>
        <span className="shrink-0 grid place-items-center min-w-[22px] h-5 px-1.5 rounded-full bg-white/20 text-white text-2xs font-extrabold">{tasks.length}</span>
      </div>
      {/* Resumen por estado */}
      <div className="flex items-center gap-2 px-3.5 pt-2">
        {(['pendiente', 'en_curso', 'hecho'] as const).filter((k) => k0[k]).map((k) => (
          <span key={k} className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full', CHIP[k])}>
            <span className={cn('h-1.5 w-1.5 rounded-full', BAR[k])} />{k0[k]} {estLabel(k)}
          </span>
        ))}
      </div>
      {/* Lista */}
      <div className="px-2 py-2 space-y-1">
        {shown.map((t) => {
          const k = estadoKey(t.estado);
          return (
            <div key={t.id} className="flex items-center gap-2 px-1.5 py-1 rounded-lg">
              <span className={cn('h-6 w-1 rounded-full shrink-0', BAR[k])} />
              {t.hora && <span className="text-2xs font-bold tabular-nums text-ink-3 shrink-0">{t.hora.slice(0, 5)}</span>}
              <span className="text-xs font-semibold text-ink truncate flex-1">{t.titulo}</span>
              {t.prioridad === 'ALTA' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
            </div>
          );
        })}
        {tasks.length > shown.length && <div className="text-2xs font-bold text-brand text-center pt-0.5">+{tasks.length - shown.length} más</div>}
      </div>
    </div>
  );
}

/** Filtro de responsable PRO: botón + popover animado con avatares. */
function RespFilter({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onEsc);
    if (menuRef.current && !reduceMotion()) gsap.fromTo(menuRef.current, { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out', transformOrigin: 'top right' });
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);
  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={cn('inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-bold transition-colors',
          value ? 'border-brand text-brand bg-brand-soft/50' : 'border-border text-ink-2 hover:bg-surface-3', open && 'ring-2 ring-brand/30 border-brand')}>
        <User className="h-3.5 w-3.5" />
        <span className="max-w-[110px] truncate">{value || 'Responsable'}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div ref={menuRef} className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[210px] max-h-[280px] overflow-auto rounded-xl border border-border bg-surface shadow-[0_16px_44px_rgba(15,36,64,0.18)] p-1.5">
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            className={cn('flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-semibold text-left transition-colors', !value ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-surface-3')}>
            <span className="grid place-items-center h-6 w-6 rounded-full bg-surface-3 text-ink-2 shrink-0"><Users className="h-3.5 w-3.5" /></span> Todos
          </button>
          {options.map((r) => (
            <button key={r} type="button" onClick={() => { onChange(r); setOpen(false); }}
              className={cn('flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-semibold text-left transition-colors', value === r ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-surface-3')}>
              <span className="grid place-items-center h-6 w-6 rounded-full bg-brand-soft text-brand text-2xs font-extrabold shrink-0">{r.charAt(0).toUpperCase()}</span>
              <span className="truncate">{r}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
