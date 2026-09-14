import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor,
  closestCenter, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, Warehouse, X, ListTodo, Search,
  User, Users, ChevronDown, CalendarX2, LogOut, AlertTriangle, RefreshCw, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery, TOUCH_QUERY } from '@/lib/useMediaQuery';
import { useSession } from '@/store/session';
import { SegStrip } from '@/components/SegStrip';
import { Popover } from '@/components/ui/Popover';
import { toast } from '@/components/ui/toast';
import { listTareas, changeEstadoTarea, updateTarea, deleteTarea, reorderTareas, subscribeTareas } from './calendarioApi';
import { TareaFormModal } from './TareaFormModal';
import { TareaCardMobile } from './TareaCardMobile';
import { TareaRowDesktop } from './TareaRowDesktop';
import { TareaActionSheet } from './TareaActionSheet';
import { estadoKey, DEPOSITOS, type Tarea } from './types';
import {
  BAR, CHIP, DEP_CORTO, DEP_ICON, ESTADO_LABEL, DIAS, DIAS_CORTO, MESES,
  fmtDay, isoOf, norm, reduceMotion, todayISO, type EstadoKey,
} from './estados';

const EST_FILTERS: { k: string; label: string }[] = [
  { k: 'all', label: 'Todas' },
  { k: 'pendiente', label: 'Pendientes' },
  { k: 'en_curso', label: 'En curso' },
  { k: 'hecho', label: 'Hechas' },
];
const EST_ACTIVE: Record<string, string> = {
  all: 'bg-gradient-to-br from-[#1478b8] to-brand text-white border-brand',
  pendiente: 'bg-amber-500 text-white border-amber-500',
  en_curso: 'bg-blue-600 text-white border-blue-600',
  hecho: 'bg-emerald-600 text-white border-emerald-600',
};

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const DAY_PREFIX = 'day:';
const CHIP_PREFIX = 'chip:';

export function CalendarioView() {
  const { user, signOut } = useSession();
  const isTouch = useMediaQuery(TOUCH_QUERY);

  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [deposito, setDeposito] = useState<string>(DEPOSITOS[0]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // false = no hay Supabase configurado y se está mostrando data de mentira.
  const [live, setLive] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tarea | null>(null);
  const [formFecha, setFormFecha] = useState(todayISO());
  const [menuTarea, setMenuTarea] = useState<Tarea | null>(null);
  const [fEstado, setFEstado] = useState('all');
  const [fResp, setFResp] = useState('');
  const [fSearch, setFSearch] = useState('');
  const [dragging, setDragging] = useState<Tarea | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [tip, setTip] = useState<{ iso: string; rect: DOMRect } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  // FLIP: solo para los reacomodos que NO vienen del drag (dnd-kit ya anima ese).
  const flipFirst = useRef<Map<number, number>>(new Map());
  const flipPending = useRef(false);

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

  /* ── Carga: ahora con loading y error de verdad ─────────────────────────
     Antes el error se tragaba y la pantalla decía "Sin tareas": con mala señal
     en el depósito el operario podía volver a cargar algo que ya existía.
     Se traen los tres depósitos en una sola consulta porque el segmentado
     muestra el contador de cada uno; filtrar en el servidor obligaría a tres. */
  useEffect(() => {
    if (cells.length === 0) return;
    let alive = true;
    setLoading(true);
    listTareas(isoOf(cells[0]!), isoOf(cells[cells.length - 1]!))
      .then((res) => {
        if (!alive) return;
        setTareas(res.rows);
        setLoadError(res.error);
        setLive(res.live);
      })
      .catch((e: Error) => { if (alive) setLoadError(e.message || 'No se pudieron cargar las tareas.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [cells, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  /* ── En vivo: dos operarios en dos teléfonos ahora se ven ───────────────── */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = subscribeTareas(() => {
      // Agrupa ráfagas (un reorder toca varias filas) en un solo refetch.
      clearTimeout(timer);
      timer = setTimeout(reload, 400);
    });
    return () => { clearTimeout(timer); stop(); };
  }, [reload]);

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

  const statusCounts = useMemo(() => {
    const rows = selectedDay ? depTareas.filter((t) => t.fecha === selectedDay) : depTareas;
    const counts: Record<string, number> = { all: rows.length, pendiente: 0, en_curso: 0, hecho: 0 };
    rows.forEach((t) => { const key = estadoKey(t.estado); counts[key] = (counts[key] ?? 0) + 1; });
    return counts;
  }, [depTareas, selectedDay]);

  const tISO = todayISO();

  /** Orden canónico: fecha primero, después el orden manual DENTRO del día. */
  const sortTareas = useCallback((rows: Tarea[]) => [...rows].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
    const oa = a.orden ?? 1e9, ob = b.orden ?? 1e9;
    if (oa !== ob) return oa - ob;
    if ((a.hora ?? '99') !== (b.hora ?? '99')) return (a.hora ?? '99').localeCompare(b.hora ?? '99');
    return a.id - b.id;
  }), []);

  const listTasks = useMemo(() => {
    let rows = selectedDay ? depTareas.filter((t) => t.fecha === selectedDay) : depTareas;
    if (fEstado !== 'all') rows = rows.filter((t) => estadoKey(t.estado) === fEstado);
    if (fResp) rows = rows.filter((t) => (t.responsable ?? '') === fResp);
    const term = norm(fSearch).trim();
    if (term) rows = rows.filter((t) => norm(t.titulo).includes(term) || norm(t.responsable).includes(term) || norm(t.descripcion).includes(term));
    return sortTareas(rows);
  }, [depTareas, selectedDay, fEstado, fResp, fSearch, sortTareas]);

  const filtersActive = fEstado !== 'all' || !!fResp || fSearch.trim() !== '';
  /* Con filtros activos hay tareas ocultas: renumerar sobre la lista visible
     escribiría `orden` pisando las que no se ven. Mejor bloquearlo y decirlo. */
  const reorderEnabled = !filtersActive;

  const clearFilters = () => { setFEstado('all'); setFResp(''); setFSearch(''); };

  /* ── Animaciones de entrada ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!rootRef.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.dep-seg', { opacity: 0, y: -8, duration: 0.45, ease: 'back.out(1.6)', clearProps: 'all' });
      gsap.from('.cal-panel', { opacity: 0, y: 18, duration: 0.55, stagger: 0.09, ease: 'power3.out', clearProps: 'all', delay: 0.05 });
    }, rootRef.current);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!gridRef.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.cal-cell', { opacity: 0, scale: 0.94, y: 6, duration: 0.34, stagger: 0.004, ease: 'power2.out', clearProps: 'all' });
    }, gridRef.current);
    return () => ctx.revert();
  }, [cells, deposito]);

  /* El riel arrancaba siempre en el día 1: el 23 del mes el operario abría la
     app y veía los días 1 al 7. Ahora se centra en el día activo. */
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const target = rail.querySelector<HTMLElement>(`[data-iso="${selectedDay ?? tISO}"]`);
    if (!target) return;
    rail.scrollTo({
      left: target.offsetLeft - rail.clientWidth / 2 + target.clientWidth / 2,
      behavior: reduceMotion() ? 'auto' : 'smooth',
    });
  }, [cursor, selectedDay, tISO, loading]);

  const flipCapture = () => {
    const m = new Map<number, number>();
    listRef.current?.querySelectorAll<HTMLElement>('[data-rowid]').forEach((el) => {
      m.set(Number(el.getAttribute('data-rowid')), el.getBoundingClientRect().top);
    });
    flipFirst.current = m; flipPending.current = true;
  };

  useLayoutEffect(() => {
    if (!flipPending.current) return;
    flipPending.current = false;
    if (reduceMotion()) { flipFirst.current = new Map(); return; }
    const first = flipFirst.current;
    listRef.current?.querySelectorAll<HTMLElement>('[data-rowid]').forEach((el) => {
      const prev = first.get(Number(el.getAttribute('data-rowid')));
      if (prev == null) return;
      const delta = prev - el.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) gsap.fromTo(el, { y: delta }, { y: 0, duration: 0.5, ease: 'power3.out' });
    });
    flipFirst.current = new Map();
  }, [listTasks]);

  /* ── Acciones ───────────────────────────────────────────────────────────── */
  const goMonth = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goToday = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); setSelectedDay(null); };
  const openNew = (fecha: string) => { setEditing(null); setFormFecha(fecha); setFormOpen(true); };
  const openEdit = (t: Tarea) => { setEditing(t); setFormOpen(true); };
  const toggleDay = (iso: string) => setSelectedDay((cur) => (cur === iso ? null : iso));

  /** Cambio de estado optimista — y si falla, ahora se avisa. */
  const setEstado = useCallback(async (t: Tarea, next: EstadoKey) => {
    const label = ESTADO_LABEL[next];
    if (label === t.estado) return;
    setTareas((prev) => prev.map((x) => (x.id === t.id ? { ...x, estado: label } : x)));
    try {
      await changeEstadoTarea(t.id, label);
    } catch (e) {
      toast((e as Error).message || 'No se pudo cambiar el estado.', 'err');
      reload();
    }
  }, [reload]);

  const moveTarea = useCallback(async (id: number, fecha: string) => {
    const cur = tareas.find((x) => x.id === id);
    if (!cur || cur.fecha === fecha) return;
    flipCapture();
    setTareas((prev) => prev.map((x) => (x.id === id ? { ...x, fecha, orden: null } : x)));
    if (!reduceMotion()) requestAnimationFrame(() => {
      const el = gridRef.current?.querySelector(`[data-iso="${fecha}"]`) ?? railRef.current?.querySelector(`[data-iso="${fecha}"]`);
      if (el) gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: 'back.out(2.2)' });
    });
    try {
      await updateTarea(id, { fecha, orden: null });
      toast('Tarea reprogramada.', 'ok');
    } catch (e) {
      toast((e as Error).message || 'No se pudo reprogramar.', 'err');
      reload();
    }
  }, [tareas, reload]);

  const removeTarea = useCallback(async (t: Tarea) => {
    setTareas((prev) => prev.filter((x) => x.id !== t.id));
    try {
      await deleteTarea(t.id);
      toast('Tarea eliminada.', 'ok');
    } catch (e) {
      toast((e as Error).message || 'No se pudo eliminar.', 'err');
      reload();
    }
  }, [reload]);

  /**
   * Reordenar. El `orden` es relativo a (depósito, fecha) — antes se escribía
   * 0..n sobre la lista visible, así que reordenar el día 5 desordenaba el mes
   * entero. Si la tarea cae en un grupo de otra fecha, además se reprograma.
   */
  const applySort = useCallback(async (activeId: number, overId: number) => {
    const from = listTasks.findIndex((t) => t.id === activeId);
    const to = listTasks.findIndex((t) => t.id === overId);
    if (from < 0 || to < 0 || from === to) return;

    const moved = listTasks[from]!;
    const next = arrayMove(listTasks, from, to);
    // La tarea adopta la fecha del grupo donde quedó (vecino de arriba, o el de
    // abajo si quedó primera). Así arrastrar entre días también reprograma.
    const neighbour = next[to - 1] ?? next[to + 1];
    const newFecha = neighbour && neighbour.id !== activeId ? neighbour.fecha : moved.fecha;
    const rebased = next.map((t) => (t.id === activeId ? { ...t, fecha: newFecha } : t));

    // Renumerar 0..n dentro de cada fecha del depósito actual.
    const counters = new Map<string, number>();
    const ordenById = new Map<number, number>();
    for (const t of rebased) {
      const n = counters.get(t.fecha) ?? 0;
      ordenById.set(t.id, n);
      counters.set(t.fecha, n + 1);
    }

    const changed = rebased
      .filter((t) => t.orden !== ordenById.get(t.id) || t.id === activeId)
      .map((t) => ({ id: t.id, orden: ordenById.get(t.id)! }));

    setTareas((prev) => prev.map((t) => {
      if (!ordenById.has(t.id)) return t;
      return { ...t, orden: ordenById.get(t.id)!, fecha: t.id === activeId ? newFecha : t.fecha };
    }));

    try {
      if (newFecha !== moved.fecha) await updateTarea(activeId, { fecha: newFecha });
      await reorderTareas(changed);
    } catch (e) {
      toast((e as Error).message || 'No se pudo guardar el orden.', 'err');
      reload();
    }
  }, [listTasks, reload]);

  /* ── dnd-kit ────────────────────────────────────────────────────────────── */
  const sensors = useSensors(
    // El arrastre siempre arranca desde el asa (⠿), nunca desde el cuerpo de la
    // tarjeta: así el scroll de la lista y el swipe horizontal quedan libres.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 12 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragStart(e: DragStartEvent) {
    const raw = String(e.active.id);
    const id = Number(raw.startsWith(CHIP_PREFIX) ? raw.slice(CHIP_PREFIX.length) : raw);
    setDragging(tareas.find((t) => t.id === id) ?? null);
    setTip(null);
  }

  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    setOverDay(null);
    const { active, over } = e;
    if (!over) return;

    const rawActive = String(active.id);
    const activeId = Number(rawActive.startsWith(CHIP_PREFIX) ? rawActive.slice(CHIP_PREFIX.length) : rawActive);
    const rawOver = String(over.id);

    if (rawOver.startsWith(DAY_PREFIX)) { void moveTarea(activeId, rawOver.slice(DAY_PREFIX.length)); return; }
    if (rawActive.startsWith(CHIP_PREFIX)) return; // chip solo se suelta en un día
    void applySort(activeId, Number(rawOver));
  }

  const sortableIds = useMemo(() => listTasks.map((t) => t.id), [listTasks]);
  const listEmpty = !loading && !loadError && listTasks.length === 0;

  return (
    <div ref={rootRef} className="flex min-h-full flex-col gap-3 bg-gradient-to-b from-brand-soft/25 to-transparent p-3 md:h-full md:p-5">
      {/* ── Cabecera ─────────────────────────────────────────────────────────
          En móvil el AppShell oculta el Topbar y el sidebar, así que esta era
          la única pantalla de la app sin título, sin usuario y sin salir. */}
      {/* Cabecera móvil: compacta, con contexto y sesión en una sola tarjeta. */}
      <header className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1478b8] via-brand to-brand-dark p-4 text-white shadow-[0_12px_30px_rgba(8,72,106,0.24)] md:hidden">
        <span className="pointer-events-none absolute -right-7 -top-10 h-28 w-28 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-12 left-16 h-24 w-24 rounded-full bg-sky-300/10" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <CalendarDays className="h-5 w-5" strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">Organizá tu jornada</p>
            <h1 className="truncate text-lg font-extrabold leading-tight">Calendario de tareas</h1>
            <p className="mt-0.5 truncate text-xs font-semibold text-white/75">
              {loading ? 'Cargando tareas…' : `${statusCounts.all} tarea${statusCounts.all === 1 ? '' : 's'} en ${DEP_CORTO[deposito] ?? deposito}`}
            </p>
          </div>
          <UserMenu nombre={user.nombre} onSignOut={signOut} />
        </div>
      </header>

      {/* Cabecera completa de escritorio. */}
      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1478b8] to-brand text-white shadow-[0_6px_16px_rgba(20,120,184,0.35)]">
          <CalendarDays className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1 md:flex-none">
          <h1 className="truncate text-base font-extrabold leading-tight text-ink md:text-xl">Calendario de tareas</h1>
          <p className="truncate text-2xs font-semibold text-ink-3">
            {loading ? 'Cargando…' : `${listTasks.length} tarea${listTasks.length === 1 ? '' : 's'} · ${deposito}`}
          </p>
        </div>

        {/* Segmentado de depósitos: en escritorio va centrado y grande */}
        <div className="dep-seg hidden min-w-0 flex-1 justify-center md:flex">
          <SegStrip
            equal
            className="w-full max-w-[620px]"
            items={DEPOSITOS.map((d) => ({ value: d, label: d, icon: DEP_ICON[d] ?? Warehouse, count: depCounts[d] ?? 0 }))}
            value={deposito}
            onChange={setDeposito}
          />
        </div>

        <button className="btn-primary hidden shrink-0 bg-gradient-to-br from-[#1478b8] to-brand md:inline-flex" onClick={() => openNew(selectedDay ?? tISO)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva tarea
        </button>

      </div>

      {/* En móvil cada depósito tiene un bloque amplio: nombre, ícono y cantidad. */}
      <section className="dep-seg shrink-0 rounded-2xl border border-border bg-surface p-2 shadow-[0_4px_18px_rgba(15,36,64,0.06)] md:hidden" aria-label="Elegir depósito">
        <div className="grid grid-cols-3 gap-1.5">
          {DEPOSITOS.map((d) => {
            const Icon = DEP_ICON[d] ?? Warehouse;
            const on = d === deposito;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDeposito(d)}
                aria-pressed={on}
                className={cn(
                  'flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 text-xs font-extrabold transition-all active:scale-[0.97]',
                  on
                    ? 'border-brand bg-gradient-to-br from-[#1478b8] to-brand text-white shadow-[0_5px_14px_rgba(20,120,184,0.28)]'
                    : 'border-transparent bg-surface text-ink-2 active:bg-surface-3',
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon className={cn('h-4 w-4 shrink-0', on ? 'text-white' : 'text-brand')} strokeWidth={2.2} />
                  <span className="truncate">{DEP_CORTO[d] ?? d}</span>
                </span>
                <span className={cn('text-[11px] font-bold tabular-nums', on ? 'text-white/75' : 'text-ink-3')}>
                  {depCounts[d] ?? 0} tarea{(depCounts[d] ?? 0) === 1 ? '' : 's'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sin esto, faltar una env var se veía igual que funcionar bien: la app
          mostraba 5 tareas inventadas y "Tarea creada" al guardar, pero nada
          se persistía. Un operario podía cargar toda su jornada al vacío. */}
      {!live && !loading && (
        <div role="alert" className="flex shrink-0 items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2.2} />
          <div className="min-w-0 text-amber-900">
            <p className="text-sm font-extrabold">No hay conexión con la base</p>
            <p className="mt-0.5 text-xs font-semibold leading-snug">
              Estas tareas son de ejemplo y <strong>lo que cargues no se va a guardar</strong>.
              No cargues nada y avisá al administrador.
            </p>
            {/* El detalle técnico solo en desarrollo: al operario no le dice nada. */}
            {import.meta.env.DEV && (
              <p className="mt-1.5 font-mono text-[10px] leading-snug text-amber-700">
                Faltan VITE_CAL_SUPABASE_URL / VITE_CAL_SUPABASE_ANON_KEY
              </p>
            )}
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => { setDragging(null); setOverDay(null); }}
        onDragOver={(e) => {
          const id = String(e.over?.id ?? '');
          setOverDay(id.startsWith(DAY_PREFIX) ? id.slice(DAY_PREFIX.length) : null);
        }}
      >
        <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-4">
          {/* ── Calendario mensual (escritorio) ── */}
          <div className="cal-panel card hidden min-h-0 flex-col overflow-hidden p-0 ring-1 ring-brand/10 lg:flex">
            <div className="flex shrink-0 items-center gap-2 bg-gradient-to-r from-[#1478b8] to-brand px-4 py-3 text-white shadow-[0_2px_10px_rgba(20,120,184,0.25)]">
              <button className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 p-0 text-white transition-colors hover:bg-white/25" onClick={() => goMonth(-1)} aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></button>
              <button className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 p-0 text-white transition-colors hover:bg-white/25" onClick={() => goMonth(1)} aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></button>
              <h2 className="ml-1 text-lg font-extrabold capitalize text-white">{MESES[cursor.m]} <span className="text-white/75">{cursor.y}</span></h2>
              <button className="ml-auto h-9 rounded-lg bg-white/15 px-3.5 font-bold text-white transition-colors hover:bg-white/25" onClick={goToday}>Hoy</button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <div className="mb-1.5 grid shrink-0 grid-cols-7 gap-1.5 rounded-lg bg-brand-soft/40 py-1.5">
                {DIAS.map((d) => <div key={d} className="text-center text-2xs font-bold uppercase tracking-wide text-brand/70">{d}</div>)}
              </div>
              <div ref={gridRef} className="grid min-h-0 flex-1 grid-cols-7 gap-1.5" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
                {cells.map((d) => {
                  const iso = isoOf(d);
                  return (
                    <DayCell
                      key={iso}
                      iso={iso}
                      day={d.getDate()}
                      inMonth={d.getMonth() === cursor.m}
                      isToday={iso === tISO}
                      isSelected={iso === selectedDay}
                      isOver={overDay === iso}
                      weekend={isWeekend(d)}
                      tasks={byDate.get(iso) ?? []}
                      dragging={!!dragging}
                      onToggle={toggleDay}
                      onNew={openNew}
                      onEdit={openEdit}
                      onHover={setTip}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Riel de días (móvil / tablet) ── */}
          <div className="cal-panel card sticky top-0 z-30 flex shrink-0 flex-col gap-2 border-brand/10 bg-white/95 p-3 shadow-[0_8px_24px_rgba(15,36,64,0.10)] backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-2">
              <button className="btn-secondary h-11 w-11 justify-center p-0" onClick={() => goMonth(-1)} aria-label="Mes anterior"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="flex-1 text-center text-base font-extrabold capitalize text-ink">{MESES[cursor.m]} <span className="text-brand">{cursor.y}</span></h2>
              <button className="btn-secondary h-11 w-11 justify-center p-0" onClick={() => goMonth(1)} aria-label="Mes siguiente"><ChevronRight className="h-5 w-5" /></button>
              <button className="btn-ghost h-11 px-3 font-bold text-brand" onClick={goToday}>Hoy</button>
            </div>
            <div ref={railRef} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1.5 no-scrollbar">
              {monthDays.map((d) => {
                const iso = isoOf(d);
                return (
                  <DayPill
                    key={iso}
                    iso={iso}
                    day={d.getDate()}
                    weekday={DIAS_CORTO[(d.getDay() + 6) % 7] ?? ''}
                    count={(byDate.get(iso) ?? []).length}
                    isToday={iso === tISO}
                    isSelected={iso === selectedDay}
                    isOver={overDay === iso}
                    dragging={!!dragging}
                    onToggle={toggleDay}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Lista de tareas ── */}
          <div className="cal-panel card flex flex-col overflow-hidden ring-1 ring-brand/10 md:min-h-0 md:flex-1">
            {/* En móvil esta cabecera repetía mes, cantidad y depósito que ya
                aparecen arriba. Se conserva completa donde sí aporta: escritorio. */}
            <div className="hidden shrink-0 items-center justify-between gap-2 bg-gradient-to-r from-[#1478b8] to-brand px-4 py-3 text-white shadow-[0_2px_10px_rgba(20,120,184,0.25)] md:flex">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/20 text-white"><ListTodo className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-white">
                    {selectedDay ? <span className="capitalize">{fmtDay(selectedDay)}</span> : `Tareas de ${MESES[cursor.m]}`}
                  </div>
                  <div className="truncate text-2xs font-semibold text-white/70">{listTasks.length} tarea{listTasks.length === 1 ? '' : 's'} · {deposito}</div>
                </div>
              </div>
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 text-2xs font-bold text-white transition-colors hover:bg-white/30">
                  <X className="h-4 w-4" /> Ver mes
                </button>
              )}
            </div>

            {selectedDay && (
              <div className="flex min-h-[48px] items-center justify-between gap-2 bg-gradient-to-r from-[#1478b8] to-brand px-3 text-white md:hidden">
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold capitalize">{fmtDay(selectedDay)}</p>
                  <p className="text-[10px] font-semibold text-white/70">{listTasks.length} tarea{listTasks.length === 1 ? '' : 's'}</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 text-[11px] font-bold text-white active:bg-white/30">
                  <X className="h-3.5 w-3.5" /> Ver mes
                </button>
              </div>
            )}

            {/* Filtros: en móvil el buscador ocupa su fila y los chips se
                deslizan; todo a 44px de alto. */}
            <div className="shrink-0 border-b border-border bg-surface-2/40 px-3 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  value={fSearch}
                  onChange={(e) => setFSearch(e.target.value)}
                  type="search"
                  enterKeyHint="search"
                  placeholder="Buscar tarea o responsable…"
                  aria-label="Buscar tarea o responsable"
                  className="input h-11 w-full pl-9"
                />
              </div>
              <div className="-mx-1 mt-2 flex items-center gap-2 overflow-x-auto px-1 pb-0.5 no-scrollbar">
                {EST_FILTERS.map((f) => (
                  <button
                    key={f.k}
                    onClick={() => setFEstado(f.k)}
                    aria-pressed={fEstado === f.k}
                    className={cn(
                      'inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-colors active:scale-[0.97]',
                      fEstado === f.k ? EST_ACTIVE[f.k] : 'border-border bg-surface text-ink-2',
                    )}
                  >
                    {f.label}
                    <span className={cn(
                      'grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[10px] font-extrabold tabular-nums',
                      fEstado === f.k ? 'bg-white/20 text-white' : 'bg-surface-3 text-ink-3',
                    )}>
                      {statusCounts[f.k] ?? 0}
                    </span>
                  </button>
                ))}
                {resps.length > 0 && <RespFilter value={fResp} options={resps} onChange={setFResp} />}
                {filtersActive && (
                  <button onClick={clearFilters} className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface-3 px-3.5 text-xs font-bold text-ink-2">
                    <X className="h-4 w-4" /> Limpiar
                  </button>
                )}
              </div>
              {filtersActive && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink-3">
                  <Lock className="h-3 w-3 shrink-0" /> Con filtros activos no se puede reordenar.
                </p>
              )}
            </div>

            <div ref={listRef} className="p-2.5 pb-24 md:min-h-0 md:flex-1 md:overflow-y-auto md:pb-2.5">
              {loading ? (
                <ListSkeleton touch={isTouch} />
              ) : loadError ? (
                <LoadError message={loadError} onRetry={reload} />
              ) : listEmpty ? (
                <EmptyList
                  filtered={filtersActive}
                  scope={selectedDay ? 'este día' : 'este mes'}
                  deposito={deposito}
                  onClear={clearFilters}
                  onNew={() => openNew(selectedDay ?? tISO)}
                />
              ) : (
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                  {isTouch ? (
                    <ul className="space-y-2.5">
                      {listTasks.map((t, i) => (
                        <TareaCardMobile
                          key={t.id}
                          tarea={t}
                          index={i}
                          showDate={!selectedDay}
                          reorderable={reorderEnabled}
                          onOpen={openEdit}
                          onEstado={setEstado}
                          onMenu={setMenuTarea}
                        />
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-2.5">
                      {listTasks.map((t, i) => (
                        <div key={t.id} data-rowid={t.id}>
                          <TareaRowDesktop
                            tarea={t}
                            index={i}
                            reorderable={reorderEnabled}
                            onOpen={openEdit}
                            onEstado={setEstado}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </SortableContext>
              )}
            </div>
          </div>
        </div>

        {/* Vista previa mientras se arrastra */}
        <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
          {dragging && (
            <div className="flex items-center gap-2 rounded-2xl border border-brand bg-surface px-3 py-2.5 shadow-[0_20px_44px_rgba(15,36,64,0.3)]">
              <span className={cn('h-8 w-1.5 shrink-0 rounded-full', BAR[estadoKey(dragging.estado)])} />
              <span className="max-w-[240px] truncate text-sm font-bold text-ink">{dragging.titulo}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* FAB: la única forma de crear en móvil, por eso va bien separado del nav */}
      <button
        onClick={() => openNew(selectedDay ?? tISO)}
        className={cn(
          'fixed right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-[#1478b8] to-brand px-5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(20,120,184,0.45)] ring-1 ring-white/20 transition-transform active:scale-95 md:hidden',
          user.rol === 'CALENDARIO'
            ? 'bottom-[calc(1rem+env(safe-area-inset-bottom))]'
            : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))]',
        )}
        aria-label="Nueva tarea"
      >
        <Plus className="h-5 w-5" strokeWidth={2.8} />
        Nueva tarea
      </button>

      {tip && !isTouch && <DayTooltip iso={tip.iso} rect={tip.rect} tasks={byDate.get(tip.iso) ?? []} />}

      <TareaFormModal
        open={formOpen}
        tarea={editing}
        defaultFecha={formFecha}
        defaultDeposito={deposito}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); reload(); }}
      />

      <TareaActionSheet
        tarea={menuTarea}
        onClose={() => setMenuTarea(null)}
        onEstado={setEstado}
        onReprogramar={(t, fecha) => void moveTarea(t.id, fecha)}
        onEditar={openEdit}
        onEliminar={removeTarea}
      />
    </div>
  );
}

/* ══════════════════════════ Sub-componentes ══════════════════════════ */

/** Celda del mes: zona donde se puede soltar una tarea para reprogramarla. */
function DayCell({
  iso, day, inMonth, isToday, isSelected, isOver, weekend, tasks, dragging, onToggle, onNew, onEdit, onHover,
}: {
  iso: string; day: number; inMonth: boolean; isToday: boolean; isSelected: boolean; isOver: boolean;
  weekend: boolean; tasks: Tarea[]; dragging: boolean;
  onToggle: (iso: string) => void; onNew: (iso: string) => void; onEdit: (t: Tarea) => void;
  onHover: (v: { iso: string; rect: DOMRect } | null) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `${DAY_PREFIX}${iso}` });
  const shown = tasks.slice(0, 3);

  return (
    <div
      ref={setNodeRef}
      data-iso={iso}
      role="button"
      tabIndex={0}
      onClick={() => onToggle(iso)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(iso); } }}
      onMouseEnter={(e) => { if (tasks.length && !dragging) onHover({ iso, rect: e.currentTarget.getBoundingClientRect() }); }}
      onMouseLeave={() => onHover(null)}
      className={cn(
        'cal-cell group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border p-1.5 text-left transition-all',
        inMonth ? (weekend ? 'border-border bg-brand-soft/20' : 'border-border bg-surface') : 'border-transparent bg-surface-2/30',
        inMonth && 'hover:border-brand/60 hover:shadow-[0_6px_18px_rgba(20,120,184,0.12)]',
        isToday && !isSelected && 'ring-1 ring-brand/40',
        isSelected && 'border-brand/50 bg-brand-soft/50 ring-2 ring-brand',
        isOver && 'scale-[1.02] border-brand bg-brand-soft/70 ring-2 ring-brand',
      )}
    >
      <div className="flex shrink-0 items-center justify-between">
        <span className={cn('text-xs font-bold tabular-nums', isToday ? 'grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[#1478b8] to-brand text-white shadow-sm' : inMonth ? 'text-ink-2' : 'text-ink-3/50')}>{day}</span>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Nueva tarea este día"
          onClick={(e) => { e.stopPropagation(); onNew(iso); }}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-gradient-to-br from-[#1478b8] to-brand text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
        </button>
      </div>
      <div className="mt-1 min-h-0 flex-1 space-y-1 overflow-hidden">
        {shown.map((t) => <CellChip key={t.id} tarea={t} onEdit={onEdit} />)}
        {tasks.length > shown.length && <div className="pl-1 text-[10px] font-bold text-brand">+{tasks.length - shown.length} más</div>}
      </div>
    </div>
  );
}

/** Chip dentro de una celda: se puede arrastrar a otro día. */
function CellChip({ tarea, onEdit }: { tarea: Tarea; onEdit: (t: Tarea) => void }) {
  const k = estadoKey(tarea.estado);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `${CHIP_PREFIX}${tarea.id}` });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onEdit(tarea); }}
      title={`${tarea.titulo} — arrastrá para reprogramar`}
      className={cn(
        'flex cursor-grab items-center gap-1 truncate rounded-md py-0.5 pl-1 pr-1 text-[11px] font-semibold transition-shadow hover:shadow-sm active:cursor-grabbing',
        CHIP[k], isDragging && 'opacity-40',
      )}
    >
      <span className={cn('h-2.5 w-1 shrink-0 rounded-full', BAR[k])} />
      {tarea.hora && <span className="shrink-0 opacity-70">{tarea.hora.slice(0, 5)}</span>}
      <span className="truncate">{tarea.titulo}</span>
    </div>
  );
}

/** Píldora del riel móvil: también acepta que le suelten una tarea encima. */
function DayPill({
  iso, day, weekday, count, isToday, isSelected, isOver, dragging, onToggle,
}: {
  iso: string; day: number; weekday: string; count: number;
  isToday: boolean; isSelected: boolean; isOver: boolean; dragging: boolean; onToggle: (iso: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `${DAY_PREFIX}${iso}` });
  return (
    <button
      ref={setNodeRef}
      data-iso={iso}
      onClick={() => onToggle(iso)}
      aria-pressed={isSelected}
      aria-label={`Día ${day}, ${count} tarea${count === 1 ? '' : 's'}`}
      className={cn(
        'cal-daypill flex min-h-[64px] w-[56px] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border transition-all',
        isSelected ? 'border-brand bg-gradient-to-br from-[#1478b8] to-brand text-white shadow-[0_6px_16px_rgba(20,120,184,0.30)]' : 'border-border bg-surface',
        isToday && !isSelected && 'ring-1 ring-brand/50',
        isOver && 'scale-110 ring-2 ring-brand',
        dragging && !isSelected && 'border-dashed border-brand/40',
      )}
    >
      <span className={cn('text-[10px] font-bold uppercase', isSelected ? 'text-white/80' : 'text-ink-3')}>{weekday}</span>
      <span className={cn('text-lg font-extrabold leading-none tabular-nums', isSelected ? 'text-white' : isToday ? 'text-brand' : 'text-ink')}>{day}</span>
      <span className={cn(
        'grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[9px] font-extrabold tabular-nums',
        count > 0
          ? (isSelected ? 'bg-white/25 text-white' : 'bg-brand-soft text-brand')
          : 'bg-transparent text-transparent',
      )}>
        {count > 0 ? count : 0}
      </span>
    </button>
  );
}

/** Menú del usuario: en móvil era la única pantalla sin forma de cerrar sesión. */
function UserMenu({ nombre, onSignOut }: { nombre: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inicial = (nombre || '?').charAt(0).toUpperCase();

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Sesión de ${nombre}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-sm font-extrabold text-brand active:bg-surface-3"
      >
        {inicial}
      </button>
      <Popover open={open} anchorRef={btnRef} onClose={() => setOpen(false)} align="end" minWidth={220}>
        <div className="px-2.5 py-2">
          <p className="text-2xs font-bold uppercase tracking-wide text-ink-3">Sesión</p>
          <p className="truncate text-sm font-bold text-ink">{nombre}</p>
        </div>
        <button
          type="button"
          onClick={() => { setOpen(false); onSignOut(); }}
          className="flex min-h-[48px] w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-semibold text-ink-2 active:bg-surface-3"
        >
          <LogOut className="h-4 w-4" /> Salir al launcher
        </button>
      </Popover>
    </>
  );
}

function ListSkeleton({ touch }: { touch: boolean }) {
  return (
    <div className="space-y-2.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={cn('animate-pulse rounded-2xl border border-border bg-surface-2', touch ? 'h-[132px]' : 'h-[74px]')} />
      ))}
      <span className="sr-only">Cargando tareas…</span>
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center" role="alert">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-200">
        <AlertTriangle className="h-7 w-7" strokeWidth={1.8} />
      </span>
      <div>
        <div className="text-sm font-extrabold text-ink">No se pudieron cargar las tareas</div>
        <p className="mt-1 max-w-[260px] text-2xs font-semibold text-ink-3">{message}</p>
        <p className="mt-1 max-w-[260px] text-2xs font-semibold text-ink-3">
          Revisá la conexión antes de volver a cargar algo: puede que ya esté registrado.
        </p>
      </div>
      <button onClick={onRetry} className="btn-primary min-h-[44px]">
        <RefreshCw className="h-4 w-4" /> Reintentar
      </button>
    </div>
  );
}

function EmptyList({
  filtered, scope, deposito, onClear, onNew,
}: { filtered: boolean; scope: string; deposito: string; onClear: () => void; onNew: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || reduceMotion()) return;
    gsap.from(ref.current.children, { opacity: 0, y: 12, scale: 0.96, duration: 0.4, stagger: 0.07, ease: 'back.out(1.6)', clearProps: 'all' });
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-3 p-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-soft to-brand-soft/40 text-brand shadow-sm ring-1 ring-brand/10">
        <CalendarX2 className="h-7 w-7" strokeWidth={1.8} />
      </span>
      <div>
        <div className="text-sm font-extrabold text-ink">{filtered ? 'Sin coincidencias' : 'Sin tareas'}</div>
        <div className="mt-1 max-w-[240px] text-2xs font-semibold text-ink-3">
          {filtered ? 'Probá con otros filtros o limpialos.' : `No hay tareas ${scope} en ${deposito}.`}
        </div>
      </div>
      {filtered ? (
        <button onClick={onClear} className="btn-secondary min-h-[44px]"><X className="h-4 w-4" /> Limpiar filtros</button>
      ) : (
        <button onClick={onNew} className="btn-primary min-h-[44px] bg-gradient-to-br from-[#1478b8] to-brand shadow-[0_6px_16px_rgba(20,120,184,0.30)]">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Agregar tarea
        </button>
      )}
    </div>
  );
}

/** Tooltip de escritorio al pasar el cursor por un día. */
function DayTooltip({ iso, rect, tasks }: { iso: string; rect: DOMRect; tasks: Tarea[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || reduceMotion()) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 10, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.24, ease: 'back.out(2.2)' });
  }, [iso]);

  const W = 268;
  const left = Math.max(8, Math.min(rect.left + rect.width / 2 - W / 2, window.innerWidth - W - 8));
  const below = rect.top < 240;
  const pos: { top?: number; bottom?: number } = below ? { top: rect.bottom + 10 } : { bottom: window.innerHeight - rect.top + 10 };

  const shown = tasks.slice(0, 6);
  const counts = tasks.reduce((a, t) => { const k = estadoKey(t.estado); a[k] = (a[k] ?? 0) + 1; return a; }, {} as Record<string, number>);

  return createPortal(
    <div ref={ref} style={{ position: 'fixed', left, width: W, zIndex: 2147483000, pointerEvents: 'none', ...pos }}
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_18px_48px_rgba(15,36,64,0.22)]">
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#1478b8] to-brand px-3.5 py-2.5 text-white">
        <span className="truncate text-2xs font-extrabold uppercase capitalize tracking-wide">{fmtDay(iso)}</span>
        <span className="grid h-5 min-w-[22px] shrink-0 place-items-center rounded-full bg-white/20 px-1.5 text-2xs font-extrabold text-white">{tasks.length}</span>
      </div>
      <div className="flex items-center gap-2 px-3.5 pt-2">
        {(['pendiente', 'en_curso', 'hecho'] as EstadoKey[]).filter((k) => counts[k]).map((k) => (
          <span key={k} className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold', CHIP[k])}>
            <span className={cn('h-1.5 w-1.5 rounded-full', BAR[k])} />{counts[k]} {ESTADO_LABEL[k]}
          </span>
        ))}
      </div>
      <div className="space-y-1 px-2 py-2">
        {shown.map((t) => {
          const k = estadoKey(t.estado);
          return (
            <div key={t.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1">
              <span className={cn('h-6 w-1 shrink-0 rounded-full', BAR[k])} />
              {t.hora && <span className="shrink-0 text-2xs font-bold tabular-nums text-ink-3">{t.hora.slice(0, 5)}</span>}
              <span className="flex-1 truncate text-xs font-semibold text-ink">{t.titulo}</span>
            </div>
          );
        })}
        {tasks.length > shown.length && <div className="pt-0.5 text-center text-2xs font-bold text-brand">+{tasks.length - shown.length} más</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Filtro de responsable — ahora en portal, no se corta dentro de la barra. */
function RespFilter({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-colors',
          value ? 'border-brand bg-brand-soft/50 text-brand' : 'border-border bg-surface text-ink-2',
        )}
      >
        <User className="h-4 w-4" />
        <span className="max-w-[110px] truncate">{value || 'Responsable'}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      <Popover open={open} anchorRef={btnRef} onClose={() => setOpen(false)} minWidth={220}>
        <button
          type="button"
          onClick={() => { onChange(''); setOpen(false); }}
          className={cn('flex min-h-[48px] w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-semibold transition-colors', !value ? 'bg-brand-soft text-brand' : 'text-ink-2 active:bg-surface-3')}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-3 text-ink-2"><Users className="h-4 w-4" /></span> Todos
        </button>
        {options.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => { onChange(r); setOpen(false); }}
            className={cn('flex min-h-[48px] w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-semibold transition-colors', value === r ? 'bg-brand-soft text-brand' : 'text-ink active:bg-surface-3')}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-2xs font-extrabold text-brand">{r.charAt(0).toUpperCase()}</span>
            <span className="truncate">{r}</span>
          </button>
        ))}
      </Popover>
    </>
  );
}
