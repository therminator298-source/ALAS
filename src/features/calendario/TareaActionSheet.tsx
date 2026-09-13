import { useEffect, useState } from 'react';
import { CalendarClock, PencilLine, Trash2, AlertTriangle, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { estadoKey, type Tarea } from './types';
import { ESTADO_KEYS, ESTADO_LABEL, EST_ICON, SOLID, fmtDay, type EstadoKey } from './estados';

interface Props {
  tarea: Tarea | null;
  onClose: () => void;
  onEstado: (t: Tarea, estado: EstadoKey) => void;
  onReprogramar: (t: Tarea, fecha: string) => void;
  onEditar: (t: Tarea) => void;
  onEliminar: (t: Tarea) => void;
}

/**
 * Menú «···» de una tarea. Existe para que todo lo que se puede hacer con un
 * gesto (deslizar para cambiar estado, mantener apretado para reordenar/mover)
 * también se pueda hacer tocando botones: el gesto es un atajo, nunca el
 * único camino.
 */
export function TareaActionSheet({ tarea, onClose, onEstado, onReprogramar, onEditar, onEliminar }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    setConfirmDelete(false);
    setFecha(tarea?.fecha ?? '');
  }, [tarea]);

  if (!tarea) return null;
  const k = estadoKey(tarea.estado);

  return (
    <Modal open={!!tarea} onClose={onClose} title={tarea.titulo} size="sm" subtitle={fmtDay(tarea.fecha)}>
      <div className="space-y-5">
        {/* Estado */}
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-3">Estado</h4>
          <div className="grid grid-cols-3 gap-2">
            {ESTADO_KEYS.map((e) => {
              const Icon = EST_ICON[e];
              const on = e === k;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => { onEstado(tarea, e); onClose(); }}
                  className={cn(
                    'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border px-1 text-xs font-bold transition-colors active:scale-[0.97]',
                    on ? cn(SOLID[e], 'border-transparent ring-4 ring-brand/15') : 'border-border bg-surface text-ink-2',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.3} />
                  {ESTADO_LABEL[e]}
                </button>
              );
            })}
          </div>
        </section>

        {/* Reprogramar */}
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-3">Reprogramar</h4>
          <div className="flex gap-2">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              aria-label="Nueva fecha"
              className="input min-h-[48px] flex-1"
            />
            <button
              type="button"
              disabled={!fecha || fecha === tarea.fecha}
              onClick={() => { onReprogramar(tarea, fecha); onClose(); }}
              className="btn-primary min-h-[48px] shrink-0 px-4"
            >
              <CalendarClock className="h-4 w-4" /> Mover
            </button>
          </div>
        </section>

        {/* Editar */}
        <button
          type="button"
          onClick={() => { onEditar(tarea); onClose(); }}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-ink active:bg-surface-3"
        >
          <PencilLine className="h-4 w-4 text-brand" /> Editar tarea completa
        </button>

        {/* Eliminar — al final, separado, y con confirmación en dos pasos */}
        <section className="border-t border-border pt-4">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 px-4 text-sm font-bold text-red-600 active:bg-red-100"
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
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="btn-ghost min-h-[48px] flex-1 justify-center bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => { onEliminar(tarea); onClose(); }}
                  className="btn min-h-[48px] flex-1 justify-center bg-red-600 text-white active:bg-red-700"
                >
                  <Check className="h-4 w-4" /> Sí, eliminar
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
