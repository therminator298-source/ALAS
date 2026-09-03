import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Si false, no cierra por clic-afuera ni ESC (solo por botón). */
  dismissable?: boolean;
}

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

export function Modal({ open, onClose, title, children, footer, size = 'md', dismissable = true }: ModalProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const bdRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && boxRef.current && bdRef.current) {
      gsap.fromTo(bdRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
      gsap.fromTo(
        boxRef.current,
        { opacity: 0, y: 8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out', clearProps: 'transform' },
      );
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal aria-label={title}>
      <div
        ref={bdRef}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={dismissable ? onClose : undefined}
      />
      <div
        ref={boxRef}
        className={cn(
          'relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-pop',
          SIZES[size],
        )}
      >
        <div className="h-1.5 shrink-0 bg-brand" />
        <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft">
              <img src="/icon-192.png" alt="ALAS" className="h-7 w-7 rounded-md object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand">ALAS</p>
              <h2 className="truncate text-base font-extrabold text-ink">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-surface-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
