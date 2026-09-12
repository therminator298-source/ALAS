import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastKind = 'ok' | 'err' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let seq = 0;
const listeners = new Set<(t: Toast[]) => void>();
let toasts: Toast[] = [];

function emit() {
  listeners.forEach((l) => l(toasts));
}

/** API global: toast('Mensaje humano', 'ok'|'err'|'info'). */
export function toast(message: string, kind: ToastKind = 'info') {
  const t: Toast = { id: ++seq, kind, message };
  toasts = [...toasts, t];
  emit();
  setTimeout(() => dismiss(t.id), 4200);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const ICON = { ok: CheckCircle2, err: AlertCircle, info: Info };
const STYLE: Record<ToastKind, string> = {
  ok: 'text-terminado',
  err: 'text-faltante',
  info: 'text-brand',
};

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>(toasts);
  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return createPortal(
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-5 right-3 md:right-5 z-[120] flex flex-col gap-2 w-80 max-w-[calc(100vw-1.5rem)] pointer-events-none">
      {items.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === 'err' ? 'alert' : 'status'}
            className="card shadow-pop flex items-start gap-2 p-3 pointer-events-auto animate-[toastIn_0.28s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', STYLE[t.kind])} />
            <p className="flex-1 min-w-0 break-words text-sm font-medium text-ink leading-snug">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="h-11 w-11 shrink-0 grid place-items-center text-ink-3 hover:text-ink" aria-label="Cerrar notificación">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>, document.body,
  );
}
