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
  className?: string;
}

const SIZES = { sm: 'alas-modal--sm', md: 'alas-modal--md', lg: 'alas-modal--lg' };
const modalStack: HTMLElement[] = [];

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
  className,
}: ModalProps) {
  const titleId = useId();
  const boxRef = useRef<HTMLElement>(null);
  const bdRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ onClose, dismissable });
  latest.current = { onClose, dismissable };

  useEffect(() => {
    const box = boxRef.current;
    const backdrop = bdRef.current;
    if (!open || !box || !backdrop) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    const previousInert = root?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    const previousModal = modalStack.at(-1);
    if (previousModal) previousModal.inert = true;
    modalStack.push(box);
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    box.focus({ preventScroll: true });

    // The visual viewport also shrinks when a phone's keyboard opens.
    const viewport = window.visualViewport;
    const fitViewport = () => {
      if (viewport && viewport.scale === 1) {
        backdrop.style.top = `${viewport.offsetTop}px`;
        backdrop.style.height = `${viewport.height}px`;
      } else {
        backdrop.style.removeProperty('top');
        backdrop.style.removeProperty('height');
      }
    };
    fitViewport();
    viewport?.addEventListener('resize', fitViewport);
    viewport?.addEventListener('scroll', fitViewport);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const animation = gsap.context(() => {
    if (!reduce && boxRef.current && bdRef.current) {
      gsap.fromTo(bdRef.current, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: 'power2.out' });
      gsap.fromTo(
        boxRef.current,
        { opacity: 0, y: 24, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'power3.out', clearProps: 'transform,opacity' },
      );
    }
    });

    const onKey = (e: KeyboardEvent) => {
      if (modalStack.at(-1) !== box || e.defaultPrevented) return;
      if (e.key === 'Escape' && latest.current.dismissable) {
        e.preventDefault();
        latest.current.onClose();
      }
      if (e.key !== 'Tab') return;
      const controls = Array.from(box.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'))
        .filter(el => el.getClientRects().length > 0 && !el.closest('[inert]'));
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) { e.preventDefault(); box.focus(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === box)) {
        e.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      animation.revert();
      window.removeEventListener('keydown', onKey);
      viewport?.removeEventListener('resize', fitViewport);
      viewport?.removeEventListener('scroll', fitViewport);
      modalStack.splice(modalStack.indexOf(box), 1);
      if (previousModal?.isConnected) previousModal.inert = false;
      if (root) root.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

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
        className={cn('alas-modal', SIZES[size], className)}
        role="dialog"
        tabIndex={-1}
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
          <button type="button" onClick={onClose} disabled={!dismissable} className="alas-modal__close disabled:opacity-40" aria-label="Cerrar">
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
