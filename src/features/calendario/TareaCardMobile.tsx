import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User, MoreHorizontal, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { estadoKey, type Tarea } from './types';
import {
  BAR, CHIP, EST_ICON, ESTADO_LABEL, NEXT_ESTADO, PREV_ESTADO, SOLID,
  dateOf, MESES_CORTO, reduceMotion, type EstadoKey,
} from './estados';

/** Desplazamiento mínimo para que el swipe cuente como acción. */
const SWIPE_TRIGGER = 68;
/** Tope visual del arrastre horizontal. */
const SWIPE_MAX = 104;

interface Props {
  tarea: Tarea;
  index: number;
  /** Muestra la fecha en la tarjeta (vista mes). En vista día sobra. */
  showDate: boolean;
  /** Con filtros activos no se puede renumerar una lista parcialmente oculta. */
  reorderable: boolean;
  onOpen: (t: Tarea) => void;
  onEstado: (t: Tarea, estado: EstadoKey) => void;
  onMenu: (t: Tarea) => void;
}

/**
 * Tarjeta de tarea para teléfono. Vertical: el título ocupa el ancho completo
 * (en la fila de escritorio le quedaban ~70px y se cortaba a 8 caracteres).
 *
 * Tres formas de cambiar el estado, porque un gesto nunca puede ser el único
 * camino: tocar el chip, deslizar la tarjeta, o el menú «···».
 */
export function TareaCardMobile({ tarea, index, showDate, reorderable, onOpen, onEstado, onMenu }: Props) {
  const k = estadoKey(tarea.estado);
  const EstIcon = EST_ICON[k];

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarea.id, disabled: !reorderable });

  const [dx, setDx] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const start = useRef<{ x: number; y: number; locked: null | 'x' | 'y' } | null>(null);
  // El desplazamiento vive también en un ref: `touchend` decide con este valor.
  // Leerlo del estado fallaba cuando varios touchmove caían en el mismo lote de
  // React (el re-render todavía no había ocurrido y el gesto se perdía).
  const dxRef = useRef(0);
  const applyDx = (v: number) => { dxRef.current = v; setDx(v); };
  const suppressClick = useRef(false);

  // Estado que quedaría si soltás ahora: izquierda = siguiente, derecha = anterior.
  const target: EstadoKey = dx < 0 ? NEXT_ESTADO[k] : PREV_ESTADO[k];
  const armed = Math.abs(dx) >= SWIPE_TRIGGER;
  const TargetIcon = EST_ICON[target];

  function onTouchStart(e: React.TouchEvent) {
    if (isDragging) return;
    const t = e.touches[0];
    if (!t) return;
    start.current = { x: t.clientX, y: t.clientY, locked: null };
  }

  function onTouchMove(e: React.TouchEvent) {
    const s = start.current;
    const t = e.touches[0];
    if (!s || !t || isDragging) return;
    const ddx = t.clientX - s.x;
    const ddy = t.clientY - s.y;

    // Decidimos una sola vez si el gesto es horizontal (swipe) o vertical
    // (scroll de la lista). Una vez decidido no cambia, para que no tironee.
    if (s.locked === null) {
      if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return;
      s.locked = Math.abs(ddx) > Math.abs(ddy) ? 'x' : 'y';
      if (s.locked === 'x') setSwiping(true);
    }
    if (s.locked !== 'x') return;

    // Resistencia en los extremos: se siente el tope en vez de cortarse seco.
    const over = Math.abs(ddx) - SWIPE_MAX;
    applyDx(over > 0 ? Math.sign(ddx) * (SWIPE_MAX + over * 0.2) : ddx);
  }

  function onTouchEnd() {
    const s = start.current;
    const total = dxRef.current;
    start.current = null;
    setSwiping(false);
    if (s?.locked === 'x') {
      // Tras un swipe el navegador igual dispara `click`: sin esto, cada
      // deslizada abría además el modal de edición.
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 350);
      if (Math.abs(total) >= SWIPE_TRIGGER) {
        onEstado(tarea, total < 0 ? NEXT_ESTADO[k] : PREV_ESTADO[k]);
        navigator.vibrate?.(12);
      }
    }
    applyDx(0);
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : transition ?? undefined,
  };

  return (
    <li
      ref={setNodeRef}
      data-rowid={tarea.id}
      style={style}
      className={cn(
        'relative list-none rounded-2xl overflow-hidden',
        isDragging && 'z-10 opacity-90 shadow-[0_18px_40px_rgba(15,36,64,0.28)] scale-[1.02]',
      )}
    >
      {/* Fondo que se revela al deslizar: color e ícono del estado destino. */}
      {dx !== 0 && (
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 flex items-center px-6 rounded-2xl transition-opacity',
            SOLID[target],
            dx < 0 ? 'justify-end' : 'justify-start',
            armed ? 'opacity-100' : 'opacity-60',
          )}
        >
          <span className="flex items-center gap-2 text-sm font-extrabold">
            <TargetIcon className={cn('h-5 w-5 transition-transform', armed && 'scale-125')} strokeWidth={2.5} />
            {ESTADO_LABEL[target]}
          </span>
        </div>
      )}

      {/* Capa de contenido: se desplaza con el dedo. El transform del drag vive
          en el <li> de arriba, así los dos gestos no se pisan. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${tarea.titulo} — ${ESTADO_LABEL[k]}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClick={() => { if (!swiping && !suppressClick.current) onOpen(tarea); }}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen(tarea); }}
        style={{
          transform: `translate3d(${dx}px,0,0)`,
          // pan-y: el navegador conserva el scroll vertical de la lista y nos
          // deja a nosotros el horizontal. Sin esto, o no hay swipe o no hay scroll.
          touchAction: 'pan-y',
          transition: swiping || reduceMotion() ? 'none' : 'transform 260ms cubic-bezier(0.16,1,0.3,1)',
        }}
        className="relative flex gap-3 rounded-2xl border border-border bg-surface p-3.5 pl-4 active:bg-surface-2"
      >
        {/* Franja de estado */}
        <span className={cn('absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl', BAR[k])} />

        <div className="min-w-0 flex-1">
          {/* Título: 3 líneas completas, sin truncar a 8 caracteres */}
          <div className="flex items-start gap-2">
            <span
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold tabular-nums text-white"
              aria-label={`Tarea número ${index + 1}`}
            >
              {index + 1}
            </span>
            <h3 className="min-w-0 flex-1 text-base font-extrabold leading-snug text-ink line-clamp-3">{tarea.titulo}</h3>
          </div>

          {tarea.descripcion && (
            <p className="mt-1.5 line-clamp-2 border-l-2 border-brand/20 pl-2 text-[13px] leading-5 text-ink-2">
              {tarea.descripcion}
            </p>
          )}

          {/* Metadatos: chips que envuelven, ninguno truncado */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {showDate && (
              <Meta>
                {dateOf(tarea.fecha).getDate()} {MESES_CORTO[dateOf(tarea.fecha).getMonth()]}
              </Meta>
            )}
            {tarea.hora && (
              <Meta><Clock className="h-3 w-3 shrink-0" />{tarea.hora.slice(0, 5)}</Meta>
            )}
            {tarea.responsable && (
              <Meta><User className="h-3 w-3 shrink-0" />{tarea.responsable}</Meta>
            )}
          </div>

          {/* Acciones: chip de estado grande + menú */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEstado(tarea, NEXT_ESTADO[k]); }}
              className={cn(
                'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold ring-1 active:scale-[0.97] transition-transform',
                CHIP[k],
                k === 'pendiente' ? 'ring-amber-300/60' : k === 'en_curso' ? 'ring-blue-300/60' : 'ring-emerald-300/60',
              )}
            >
              <EstIcon className="h-4 w-4" strokeWidth={2.4} />
              {ESTADO_LABEL[k]}
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMenu(tarea); }}
              aria-label={`Más acciones para ${tarea.titulo}`}
              className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border border-border bg-surface text-ink-2 active:bg-surface-3"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {/* Asa de arrastre. Va sola, con `touch-action: none`: si los
                listeners viven en toda la tarjeta, el navegador se queda con el
                gesto vertical (scroll de la página) y el arrastre nunca arranca.
                Con asa propia conviven scroll, swipe horizontal y reordenar. */}
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              type="button"
              disabled={!reorderable}
              aria-label={reorderable ? `Reordenar ${tarea.titulo}` : 'Quitá los filtros para reordenar'}
              title={reorderable ? 'Arrastrá para reordenar o mover de día' : 'Quitá los filtros para reordenar'}
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: 'none' }}
              className={cn(
                'grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl transition-colors',
                reorderable
                  ? 'cursor-grab text-ink-3/60 active:cursor-grabbing active:bg-surface-3'
                  : 'cursor-not-allowed bg-surface-3/60 text-ink-3/25',
              )}
            >
              <GripVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-1 text-[11px] font-semibold text-ink-2">
      {children}
    </span>
  );
}
