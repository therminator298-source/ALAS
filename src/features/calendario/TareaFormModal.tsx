import { useEffect, useRef, useState } from 'react';
import { Check, Trash2, Clock3, Loader, CheckCircle2, type LucideIcon } from 'lucide-react';
import gsap from 'gsap';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import { cn } from '@/lib/utils';
import { createTarea, updateTarea, deleteTarea } from './calendarioApi';
import { DEPOSITOS, type Tarea } from './types';

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
      setTitulo(''); setFecha(defaultFecha); setHora(''); setResponsable(''); setDeposito(defaultDeposito);
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
            <button className="btn-ghost mr-auto text-faltante" onClick={remove} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          )}
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            <Check className="h-4 w-4" strokeWidth={2.5} /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título *">
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="¿Qué hay que hacer?" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha *"><input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
          <Field label="Hora"><input type="time" className="input" value={hora} onChange={(e) => setHora(e.target.value)} /></Field>
        </div>
        <Field label="Estado">
          <EstadoButtons value={estado} onChange={setEstado} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Depósito">
            <select className="input" value={deposito} onChange={(e) => setDeposito(e.target.value)}>
              {DEPOSITOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Responsable"><input className="input" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre del responsable" /></Field>
        </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
