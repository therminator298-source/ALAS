import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

const MARGIN = 8;
const GAP = 6;

interface Props {
  open: boolean;
  anchorRef: RefObject<HTMLElement>;
  onClose: () => void;
  children: ReactNode;
  /** El panel toma el ancho del disparador (selects). Si no, usa minWidth. */
  matchWidth?: boolean;
  minWidth?: number;
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Popover anclado que se dibuja en un portal sobre <body>.
 *
 * Los popovers anteriores eran `absolute` dentro del cuerpo scrolleable del
 * modal: el selector de tipo de tarea (6 opciones, ~280px) es el primer campo
 * de una hoja de 92dvh y quedaba cortado, sin forma de verlo entero con el
 * teclado abierto. Acá se calcula el espacio real disponible, se voltea hacia
 * arriba si abajo no entra, y se limita la altura al hueco que queda.
 */
export function Popover({ open, anchorRef, onClose, children, matchWidth, minWidth = 210, align = 'start', className }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; top?: number; bottom?: number; width?: number; maxHeight: number; up: boolean } | null>(null);

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();

    // El viewport visual encoge cuando se abre el teclado del teléfono; usarlo
    // evita colocar el panel debajo del teclado.
    const vv = window.visualViewport;
    const vTop = vv?.offsetTop ?? 0;
    const vH = vv?.height ?? window.innerHeight;
    const vW = vv?.width ?? window.innerWidth;

    const below = vTop + vH - r.bottom - GAP - MARGIN;
    const above = r.top - vTop - GAP - MARGIN;
    const up = below < 200 && above > below;
    const maxHeight = Math.max(140, Math.floor(up ? above : below));

    const width = matchWidth ? r.width : Math.max(minWidth, r.width);
    const rawLeft = align === 'end' ? r.right - width : r.left;
    const left = Math.max(MARGIN, Math.min(rawLeft, vW - width - MARGIN));

    // `position: fixed` se resuelve contra el viewport de layout, así que el
    // offset de abajo se mide con innerHeight (no con el viewport visual).
    setBox(up
      ? { left, bottom: window.innerHeight - r.top + GAP, width, maxHeight, up }
      : { left, top: r.bottom + GAP, width, maxHeight, up });
  }, [align, anchorRef, matchWidth, minWidth]);

  useLayoutEffect(() => {
    if (!open) { setBox(null); return; }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    // El panel se monta en un render posterior a este efecto (primero hay que
    // medir para saber dónde ponerlo). Por eso `panelRef.current` se lee DENTRO
    // del handler: capturarlo acá daba null para siempre, el `contains()` fallaba
    // y el popover se cerraba en el touchstart de sus propias opciones — un tap
    // sobre una opción no llegaba nunca al click.
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    // capture: escuchamos el scroll de cualquier contenedor, no solo el de window.
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [open, onClose, place, anchorRef]);

  // Animación de entrada: corre cuando el panel ya existe en el DOM.
  const placed = !!box;
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !placed || !panel) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(panel, { opacity: 0, y: -6, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' });
  }, [open, placed]);

  if (!open || !box) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="listbox"
      style={{
        position: 'fixed',
        left: box.left,
        width: box.width,
        maxHeight: box.maxHeight,
        // Anclado por `bottom` cuando abre hacia arriba: crece hacia arriba sin
        // taparse a sí mismo ni salirse por el borde superior.
        ...(box.up ? { bottom: box.bottom } : { top: box.top }),
        transformOrigin: box.up ? 'bottom center' : 'top center',
        zIndex: 2147483000,
      }}
      className={cn(
        'overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-1.5 shadow-[0_16px_44px_rgba(15,36,64,0.20)]',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
