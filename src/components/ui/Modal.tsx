import { useEffect, useId, useRef, type ReactNode } from 'react';
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
  dismissable?: boolean;
  eyebrow?: string;
  subtitle?: string;
}

const SIZES = { sm: 'alas-modal--sm', md: 'alas-modal--md', lg: 'alas-modal--lg' };

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  dismissable = true,
  eyebrow,
  subtitle,
}: ModalProps) {
  const titleId = useId();
  const boxRef = useRef<HTMLElement>(null);
  const bdRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && boxRef.current && bdRef.current) {
      gsap.fromTo(bdRef.current, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: 'power2.out' });
      gsap.fromTo(
        boxRef.current,
        { opacity: 0, y: 24, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'power3.out', clearProps: 'transform,opacity' },
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
    <div
      ref={bdRef}
      className="alas-modal-backdrop"
      role="presentation"
      onClick={dismissable ? onClose : undefined}
    >
      <section
        ref={boxRef}
        className={cn('alas-modal', SIZES[size])}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="alas-modal__header">
          <div className="min-w-0">
            {eyebrow && <p className="alas-modal__eyebrow">{eyebrow}</p>}
            <h2 id={titleId} className="alas-modal__title">{title}</h2>
            {subtitle && <p className="alas-modal__subtitle">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="alas-modal__close" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="alas-modal__body">{children}</div>
        {footer && <div className="alas-modal__footer">{footer}</div>}
      </section>
    </div>,
    document.body,
  );
}
