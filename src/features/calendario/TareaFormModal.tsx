import { useEffect, useRef, useState } from 'react';
import {
  Check, Trash2, PackageOpen, PackagePlus, Wrench, Recycle, PenLine, ChevronDown, Tag,
  AlertTriangle, type LucideIcon,
} from 'lucide-react';
import gsap from 'gsap';
import { Modal } from '@/components/ui/Modal';
import { Popover } from '@/components/ui/Popover';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import { cn } from '@/lib/utils';
import { createTarea, updateTarea, deleteTarea } from './calendarioApi';
import { DEPOSITOS, type Tarea } from './types';
import { DEP_ICON, ESTADO_KEYS, ESTADO_LABEL, EST_ICON, SOLID, todayISO, reduceMotion, type EstadoKey } from './estados';

const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// Tipos de tarea (seleccionador). "OTROS" deja escribir un título libre.
const TAREA_TIPOS = ['DESCARGA', 'REPOSICIÓN', 'ARREGLO', 'CARGA DE BASURA', 'CARGA DE CHATARRA', 'OTROS'];
const TIPO_ICONS: Record<string, LucideIcon> = {
  'DESCARGA': PackageOpen, 'REPOSICIÓN': PackagePlus, 'ARREGLO': Wrench,
  'CARGA DE BASURA': Trash2, 'CARGA DE CHATARRA': Recycle, 'OTROS': PenLine,
};

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
  const [estado, setEstado] = useState('Pendiente');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (tarea) {
      setTitulo(tarea.titulo); setFecha(tarea.fecha); setHora(tarea.hora ?? '');
      setResponsable(tarea.responsable ?? ''); setDeposito(tarea.deposito ?? defaultDeposito);
      setEstado(tarea.estado); setDescripcion(tarea.descripcion ?? '');
    } else {
      setTitulo(''); setFecha(defaultFecha || todayISO()); setHora(nowHM()); setResponsable('');
      setDeposito(defaultDeposito); setEstado('Pendiente'); setDescripcion('');
    }
  }, [open, tarea, defaultFecha, defaultDeposito]);

  async function save() {
    if (!titulo.trim()) { toast('Poné un título.', 'err'); return; }
    if (!fecha) { toast('Elegí una fecha.', 'err'); return; }
    setSaving(true);
    const payload = {
      titulo: titulo.trim(), fecha, hora: hora || null, responsable: responsable.trim() || null,
      deposito: deposito || null, estado, descripcion: descripcion.trim() || null, usuario: user.nombre,
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
      eyebrow={tarea ? undefined : `Almacén · ${deposito}`}
      size="md"
      footer={
        /* Solo Cancelar y Guardar. "Eliminar" estaba acá al lado de Guardar,
           los tres estirados al mismo ancho en móvil y sin confirmación: un
           toque errado borraba la tarea. Ahora vive al final del formulario. */
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            <Check className="h-4 w-4" strokeWidth={2.5} /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="¿Qué tarea hay que hacer? *">
          <TipoSelect value={titulo} onPick={setTitulo} />
          <input
            className="input mt-2 min-h-[48px]"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Elegí un tipo arriba o escribí…"
            aria-label="Título de la tarea"
            autoCapitalize="characters"
            autoComplete="off"
            enterKeyHint="next"
          />
        </Field>

        <Field label="Descripción (opcional)">
          <textarea
            className="input min-h-[88px] resize-y py-2.5"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Agregá instrucciones o detalles importantes…"
            aria-label="Descripción"
            autoCapitalize="sentences"
            enterKeyHint="next"
          />
          <p className="mt-1.5 text-[11px] font-medium text-ink-3">Se mostrará debajo del título en la tarjeta.</p>
        </Field>

        {/* Fecha y hora a ancho completo en móvil: son los dos campos más
            usados y en `grid-cols-2` quedaban en ~150px cada uno. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha *">
            <input type="date" aria-label="Fecha de la tarea" className="input min-h-[48px]" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <Field label="Hora">
            <input type="time" aria-label="Hora de la tarea" className="input min-h-[48px]" value={hora} onChange={(e) => setHora(e.target.value)} />
          </Field>
        </div>

        {tarea && (
          <Field label="Estado">
            <EstadoButtons value={estado} onChange={setEstado} />
          </Field>
        )}

        {tarea && (
          <Field label="Almacén">
            <DepositoButtons value={deposito} onChange={setDeposito} />
          </Field>
        )}

        <Field label="Responsable">
          <input
            className="input min-h-[48px]"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Nombre del responsable"
            aria-label="Responsable"
            autoCapitalize="words"
            autoComplete="off"
            enterKeyHint="next"
          />
        </Field>

        {/* Zona destructiva: al final, separada, y en dos pasos */}
        {tarea && (
          <section className="border-t border-border pt-4">
            {!confirmDelete ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmDelete(true)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 text-sm font-bold text-red-600 active:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Eliminar tarea
              </button>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
                <p className="flex items-start gap-2 text-sm font-bold text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Se elimina definitivamente. No se puede deshacer.
                </p>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={saving} onClick={() => setConfirmDelete(false)} className="btn-ghost min-h-[48px] flex-1 justify-center bg-white">
                    Cancelar
                  </button>
                  <button type="button" disabled={saving} onClick={remove} className="btn min-h-[48px] flex-1 justify-center bg-red-600 text-white active:bg-red-700">
                    <Check className="h-4 w-4" /> Sí, eliminar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}

/** Botones de estado con feedback GSAP inmediato (pop rápido al tocar). */
function EstadoButtons({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function pick(k: EstadoKey) {
    const label = ESTADO_LABEL[k];
    if (label !== value) onChange(label);
    const el = refs.current[label];
    if (!el || reduceMotion()) return;
    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.28, ease: 'back.out(3)' });
    const ic = el.querySelector('svg');
    if (ic) gsap.fromTo(ic, { rotate: -18, scale: 0.7 }, { rotate: 0, scale: 1, duration: 0.32, ease: 'back.out(4)' });
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {ESTADO_KEYS.map((k) => {
        const label = ESTADO_LABEL[k];
        const on = label === value;
        const Icon = EST_ICON[k];
        return (
          <button
            key={k}
            type="button"
            ref={(n) => { refs.current[label] = n; }}
            onClick={() => pick(k)}
            className={cn(
              'flex min-h-[52px] select-none items-center justify-center gap-2 rounded-xl border px-2 text-sm font-bold transition-colors duration-150 active:scale-[0.97]',
              on ? cn(SOLID[k], 'border-transparent shadow-sm ring-4 ring-brand/15') : 'border-border bg-surface text-ink-2',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Seleccionador de tipo de tarea. El popover ahora se dibuja en un portal: era
 * `absolute` dentro del cuerpo scrolleable del modal y, siendo el primer campo
 * de una hoja de 92dvh, sus 6 opciones quedaban cortadas en el teléfono.
 */
function TipoSelect({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const sel = TAREA_TIPOS.find((t) => t !== 'OTROS' && t === value.trim().toUpperCase()) || '';
  const SelIcon = sel ? (TIPO_ICONS[sel] ?? Tag) : Tag;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border px-3 text-sm font-bold transition-colors',
          sel ? 'border-brand bg-brand-soft/40 text-brand' : 'border-border bg-surface text-ink-2',
          open && 'border-brand ring-2 ring-brand/30',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', sel ? 'bg-gradient-to-br from-[#1478b8] to-brand text-white' : 'bg-surface-3 text-ink-3')}>
            <SelIcon className="h-4 w-4" />
          </span>
          <span className="truncate">{sel || 'Elegí el tipo de tarea'}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      <Popover open={open} anchorRef={btnRef} onClose={() => setOpen(false)} matchWidth>
        {TAREA_TIPOS.map((tp) => {
          const on = tp === sel;
          const Icon = TIPO_ICONS[tp] ?? Tag;
          return (
            <button
              key={tp}
              type="button"
              onClick={() => { onPick(tp === 'OTROS' ? '' : tp); setOpen(false); }}
              className={cn(
                'flex min-h-[52px] w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-semibold transition-colors',
                on ? 'bg-brand-soft text-brand' : 'text-ink active:bg-surface-3',
              )}
            >
              <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', on ? 'bg-gradient-to-br from-[#1478b8] to-brand text-white' : 'bg-surface-3 text-ink-2')}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{tp === 'OTROS' ? 'Otros (escribir)…' : tp}</span>
              {on && <Check className="ml-auto h-4 w-4 shrink-0" strokeWidth={2.5} />}
            </button>
          );
        })}
      </Popover>
    </>
  );
}

/** Almacenes: una columna en el teléfono — en `grid-cols-3` "Depósito Luque
 *  Sanber" a 11px se partía en tres líneas dentro de una columna de ~105px. */
function DepositoButtons({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function pick(v: string) {
    if (v !== value) onChange(v);
    const el = refs.current[v];
    if (!el || reduceMotion()) return;
    gsap.fromTo(el, { scale: 0.96 }, { scale: 1, duration: 0.28, ease: 'back.out(3)' });
    const ic = el.querySelector('svg');
    if (ic) gsap.fromTo(ic, { scale: 0.6 }, { scale: 1, duration: 0.34, ease: 'back.out(4)' });
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {DEPOSITOS.map((d) => {
        const on = d === value;
        const Icon = DEP_ICON[d] ?? Tag;
        return (
          <button
            key={d}
            type="button"
            ref={(n) => { refs.current[d] = n; }}
            onClick={() => pick(d)}
            className={cn(
              'flex min-h-[52px] select-none items-center gap-2.5 rounded-xl border px-3 text-left text-sm font-bold transition-colors duration-150 active:scale-[0.98]',
              'sm:flex-col sm:justify-center sm:gap-1.5 sm:px-2 sm:py-3 sm:text-center sm:text-2xs',
              on
                ? 'border-brand bg-gradient-to-br from-[#1478b8] to-brand text-white shadow-sm ring-4 ring-brand/25'
                : 'border-border bg-surface text-ink-2',
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0 sm:h-6 sm:w-6', on ? 'text-white' : 'text-brand')} strokeWidth={1.9} />
            <span className="leading-tight">{d}</span>
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-2">{label}</span>
      {children}
    </div>
  );
}
