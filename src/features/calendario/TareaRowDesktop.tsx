import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import gsap from 'gsap';
import { Clock, User, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { estadoKey, type Tarea } from './types';
import {
  BAR, CHIP, EST_BADGE, EST_ICON, EST_RING, ESTADO_LABEL, MESES_CORTO, NEXT_ESTADO,
  dateOf, reduceMotion, type EstadoKey,
} from './estados';

interface Props {
  tarea: Tarea;
  index: number;
  reorderable: boolean;
  onOpen: (t: Tarea) => void;
  onEstado: (t: Tarea, estado: EstadoKey) => void;
}

/** Fila compacta para escritorio: una línea, arrastrable por el asa. */
export function TareaRowDesktop({ tarea, index, reorderable, onOpen, onEstado }: Props) {
  const k = estadoKey(tarea.estado);
  const EstIcon = EST_ICON[k];
  const d = dateOf(tarea.fecha);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarea.id, disabled: !reorderable });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(tarea)}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(tarea); }}
      className={cn(
        'cal-row group relative flex items-center gap-2 overflow-hidden rounded-2xl border bg-surface py-2.5 pl-2 pr-3 transition-shadow',
        'cursor-pointer hover:border-brand/40 hover:shadow-[0_8px_22px_rgba(20,120,184,0.12)]',
        isDragging ? 'z-10 border-brand opacity-95 shadow-[0_18px_40px_rgba(15,36,64,0.25)]' : 'border-border',
      )}
    >
      <span className={cn('absolute bottom-0 left-0 top-0 w-1.5 transition-all group-hover:w-2', BAR[k])} />

      {/* Asa: el arrastre arranca acá, así el click en la fila sigue abriendo la tarea */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        disabled={!reorderable}
        aria-label={reorderable ? `Reordenar ${tarea.titulo}` : 'Quitá los filtros para reordenar'}
        title={reorderable ? 'Arrastrá para reordenar o mover de día' : 'Quitá los filtros para poder reordenar'}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'ml-0.5 grid h-9 w-6 shrink-0 place-items-center rounded-md text-ink-3/40 transition-colors',
          reorderable ? 'cursor-grab hover:text-brand active:cursor-grabbing' : 'cursor-not-allowed opacity-30',
        )}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="grid h-7 min-w-[38px] shrink-0 place-items-center rounded-lg bg-brand-soft px-1.5 text-[10px] font-extrabold tracking-wide text-brand ring-1 ring-brand/15 transition-colors group-hover:bg-brand group-hover:text-white">
        #{String(index + 1).padStart(2, '0')}
      </span>

      <div className={cn('flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border', EST_BADGE[k])}>
        <span className="text-base font-extrabold leading-none tabular-nums">{d.getDate()}</span>
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide opacity-80">{MESES_CORTO[d.getMonth()]}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate text-sm font-bold text-ink">
          <span className="truncate">{tarea.titulo}</span>
          {tarea.descripcion && (
            <>
              <span className="shrink-0 text-border-strong">·</span>
              <span className="truncate text-xs font-medium text-ink-3">{tarea.descripcion}</span>
            </>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {tarea.hora && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] font-bold text-ink-2">
              <Clock className="h-3 w-3" />{tarea.hora.slice(0, 5)}
            </span>
          )}
          <span className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-ink-2">
            <User className="h-3 w-3 shrink-0" />{tarea.responsable ?? 'Sin responsable'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEstado(tarea, NEXT_ESTADO[k]);
          if (reduceMotion()) return;
          gsap.fromTo(e.currentTarget, { scale: 0.72 }, { scale: 1, duration: 0.42, ease: 'back.out(3.5)' });
          const ic = e.currentTarget.querySelector('svg');
          if (ic) gsap.fromTo(ic, { rotate: -45, scale: 0.5 }, { rotate: 0, scale: 1, duration: 0.42, ease: 'back.out(4)' });
        }}
        title="Clic para cambiar el estado"
        className={cn(
          'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full pl-2.5 pr-3 text-2xs font-extrabold ring-1 transition-transform hover:scale-105 active:scale-95',
          CHIP[k], EST_RING[k],
        )}
      >
        <EstIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
        {ESTADO_LABEL[k]}
      </button>
    </div>
  );
}
