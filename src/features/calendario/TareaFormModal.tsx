import { useEffect, useRef, useState } from 'react';
import { Check, Trash2, Clock3, Loader, CheckCircle2, Warehouse, Factory, Building2, PackageOpen, PackagePlus, Wrench, Recycle, PenLine, ChevronDown, Tag, type LucideIcon } from 'lucide-react';
import gsap from 'gsap';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import { cn } from '@/lib/utils';
import { createTarea, updateTarea, deleteTarea } from './calendarioApi';
import { DEPOSITOS, type Tarea } from './types';

const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
// Tipos de tarea (seleccionador). "OTROS" deja escribir un título libre.
const TAREA_TIPOS = ['DESCARGA', 'REPOSICIÓN', 'ARREGLO', 'CARGA DE BASURA', 'CARGA DE CHATARRA', 'OTROS'];
const TIPO_ICONS: Record<string, LucideIcon> = {
  'DESCARGA': PackageOpen, 'REPOSICIÓN': PackagePlus, 'ARREGLO': Wrench,
  'CARGA DE BASURA': Trash2, 'CARGA DE CHATARRA': Recycle, 'OTROS': PenLine,
};
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const DEP_ICONS: Record<string, LucideIcon> = { 'Depósito Central': Warehouse, 'Fábrica': Factory, 'Depósito Luque Sanber': Building2 };

/** Estados como botones rápidos: un toque cambia y se ve al instante. */
const ESTADO_BTNS: { value: string; label: string; icon: LucideIcon; on: string; ring: string; dot: string }[] = [
  { value: 'Pendiente', label: 'Pendiente', icon: Clock3, on: 'bg-amber-500 border-amber-500 text-white', ring: 'ring-amber-400/40', dot: 'text-amber-500' },
  { value: 'En curso', label: 'En curso', icon: Loader, on: 'bg-blue-600 border-blue-600 text-white', ring: 'ring-blue-500/40', dot: 'text-blue-600' },
  { value: 'Hecho', label: 'Hecho', icon: CheckCircle2, on: 'bg-emerald-600 border-emerald-600 text-white', ring: 'ring-emerald-500/40', dot: 'text-emerald-600' },
];

interface Props {
  open: boolean;
  tarea: Tarea | null;         // null = nueva
  defaultFecha: string;        // YYYY-MM-DD para nueva
  defaultDeposito: string;     // depósito seleccionado
  onClose: () => void;
  onSaved: () => void;
}

export function TareaFormModal({ open, tarea, defaultFecha, defaultDeposito, onClose, onSaved }: Props) {
  const { user } = useSession();
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState(defaultFecha);
  const [hora, setHora] = useState('');
  const [responsable, setResponsable] = useState('');
  const [deposito, setDeposito] = useState(defaultDeposito);
  const [prioridad, setPrioridad] = useState('NORMAL');
  const [estado, setEstado] = useState('Pendiente');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (tarea) {
      setTitulo(tarea.titulo); setFecha(tarea.fecha); setHora(tarea.hora ?? '');
      setResponsable(tarea.responsable ?? ''); setDeposito(tarea.deposito ?? defaultDeposito);
      setPrioridad(tarea.prioridad); setEstado(tarea.estado); setDescripcion(tarea.descripcion ?? '');
    } else {
      // Nueva tarea: siempre fecha y hora actuales por defecto.
      setTitulo(''); setFecha(defaultFecha || todayISO()); setHora(nowHM()); setResponsable(''); setDeposito(defaultDeposito);
      setPrioridad('NORMAL'); setEstado('Pendiente'); setDescripcion('');
    }
  }, [open, tarea, defaultFecha, defaultDeposito]);

  async function save() {
    if (!titulo.trim()) { toast('Poné un título.', 'err'); return; }
    if (!fecha) { toast('Elegí una fecha.', 'err'); return; }
    setSaving(true);
    const payload = {
      titulo: titulo.trim(), fecha, hora: hora || null, responsable: responsable.trim() || null,
      deposito: deposito || null, prioridad, estado, descripcion: descripcion.trim() || null, usuario: user.nombre,
    };
    try {
      if (tarea) { await updateTarea(tarea.id, payload); toast('Tarea actualizada.', 'ok'); }
      else { await createTarea(payload); toast('Tarea creada.', 'ok'); }
      onSaved();
    } catch (e) { toast((e as Error).message || 'No se pudo guardar.', 'err'); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!tarea) return;
    setSaving(true);
    try { await deleteTarea(tarea.id); toast('Tarea eliminada.', 'ok'); onSaved(); }
    catch (e) { toast((e as Error).message || 'No se pudo eliminar.', 'err'); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tarea ? 'Editar tarea' : 'Nueva tarea'}
      size="md"
      footer={
        <>
          {tarea && (
            <button type="button" className="btn-ghost mr-auto text-faltante" onClick={remove} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            <Check className="h-4 w-4" strokeWidth={2.5} /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título *">
          <TipoSelect value={titulo} onPick={setTitulo} />
          <input className="input mt-2" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Elegí un tipo arriba o escribí…" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha *"><input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
          <Field label="Hora"><input type="time" className="input" value={hora} onChange={(e) => setHora(e.target.value)} /></Field>
        </div>
        {tarea && (
          <Field label="Estado">
            <EstadoButtons value={estado} onChange={setEstado} />
          </Field>
        )}
        <Field label="Depósito">
          <DepositoButtons value={deposito} onChange={setDeposito} />
        </Field>
        <Field label="Responsable"><input className="input" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre del responsable" /></Field>
        <Field label="Descripción">
          <textarea className="input min-h-[80px] py-2.5 resize-y" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle de la tarea…" />
        </Field>
      </div>
    </Modal>
  );
}

/** Botones de estado con feedback GSAP inmediato (pop rápido al tocar). */
function EstadoButtons({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function pick(v: string) {
    if (v !== value) onChange(v);
    const el = refs.current[v];
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.28, ease: 'back.out(3)' });
    const ic = el.querySelector('svg');
    if (ic) gsap.fromTo(ic, { rotate: -18, scale: 0.7 }, { rotate: 0, scale: 1, duration: 0.32, ease: 'back.out(4)' });
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {ESTADO_BTNS.map((b) => {
        const on = b.value === value;
        const Icon = b.icon;
        return (
          <button
            key={b.value}
            type="button"
            ref={(n) => { refs.current[b.value] = n; }}
            onClick={() => pick(b.value)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-sm font-bold transition-colors duration-150 select-none active:scale-[0.97]',
              on ? cn(b.on, 'shadow-sm ring-4', b.ring) : 'border-border bg-surface text-ink-2 hover:bg-surface-3',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', on ? 'text-white' : b.dot)} strokeWidth={2.4} />
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

/** Seleccionador PRO de tipo de tarea: botón + popover animado con íconos. */
function TipoSelect({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sel = TAREA_TIPOS.find((t) => t !== 'OTROS' && t === value.trim().toUpperCase()) || '';
  const SelIcon = sel ? (TIPO_ICONS[sel] ?? Tag) : Tag;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onEsc);
    if (menuRef.current && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(menuRef.current, { opacity: 0, y: -8, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'back.out(2)', transformOrigin: 'top center' });
      gsap.fromTo(menuRef.current.querySelectorAll('.tipo-opt'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.03, ease: 'power2.out', delay: 0.04 });
    }
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={cn('w-full flex items-center justify-between gap-2 h-11 px-3 rounded-xl border text-sm font-bold transition-colors',
          sel ? 'border-brand bg-brand-soft/40 text-brand' : 'border-border bg-surface text-ink-2 hover:bg-surface-3', open && 'ring-2 ring-brand/30 border-brand')}>
        <span className="flex items-center gap-2 min-w-0">
          <span className={cn('grid place-items-center h-6 w-6 rounded-lg shrink-0', sel ? 'bg-gradient-to-br from-[#1478b8] to-brand text-white' : 'bg-surface-3 text-ink-3')}><SelIcon className="h-3.5 w-3.5" /></span>
          <span className="truncate">{sel || 'Elegí el tipo de tarea'}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div ref={menuRef} className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-border bg-surface shadow-[0_16px_44px_rgba(15,36,64,0.20)] p-1.5">
          {TAREA_TIPOS.map((tp) => {
            const on = tp === sel;
            const Icon = TIPO_ICONS[tp] ?? Tag;
            return (
              <button key={tp} type="button"
                onClick={() => { onPick(tp === 'OTROS' ? '' : tp); setOpen(false); }}
                className={cn('tipo-opt flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-semibold text-left transition-colors',
                  on ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-surface-3')}>
                <span className={cn('grid place-items-center h-7 w-7 rounded-lg shrink-0', on ? 'bg-gradient-to-br from-[#1478b8] to-brand text-white' : 'bg-surface-3 text-ink-2')}><Icon className="h-4 w-4" /></span>
                <span className="truncate">{tp === 'OTROS' ? 'Otros (escribir)…' : tp}</span>
                {on && <Check className="h-4 w-4 ml-auto shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Depósitos en grilla PRO con íconos y pop GSAP al seleccionar. */
function DepositoButtons({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  function pick(v: string) {
    if (v !== value) onChange(v);
    const el = refs.current[v];
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.28, ease: 'back.out(3)' });
    const ic = el.querySelector('svg');
    if (ic) gsap.fromTo(ic, { scale: 0.6, y: -4 }, { scale: 1, y: 0, duration: 0.34, ease: 'back.out(4)' });
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {DEPOSITOS.map((d) => {
        const on = d === value;
        const Icon = DEP_ICONS[d] ?? Warehouse;
        return (
          <button
            key={d}
            type="button"
            ref={(n) => { refs.current[d] = n; }}
            onClick={() => pick(d)}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors duration-150 select-none active:scale-[0.97]',
              on ? 'bg-gradient-to-br from-[#1478b8] to-brand border-brand text-white shadow-sm ring-4 ring-brand/25' : 'border-border bg-surface text-ink-2 hover:bg-surface-3 hover:border-brand/40',
            )}
          >
            <Icon className={cn('h-6 w-6 shrink-0', on ? 'text-white' : 'text-brand')} strokeWidth={1.9} />
            <span className="text-2xs font-bold leading-tight">{d}</span>
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
