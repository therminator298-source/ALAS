import { forwardRef, useState } from 'react';
import { Camera, ImageOff, Package, Clock } from 'lucide-react';
import { ReasonBadge } from '@/components/ui/ReasonBadge';
import { REASON_STYLES } from '@/config/constants';
import { fmtAge, cn } from '@/lib/utils';
import type { BoardIncident } from '@/services/board';

interface Props {
  inc: BoardIncident;
  /** Props de @dnd-kit. Se desparraman en la raíz para que la tarjeta arrastre. */
  dragProps?: Record<string, unknown>;
  /** true mientras esta tarjeta viaja en el DragOverlay. */
  fantasma?: boolean;
  onOpen?: (inc: BoardIncident) => void;
  onPhotos?: (inc: BoardIncident) => void;
}

/**
 * La miniatura.
 *
 * Tiene tres estados y los tres importan, porque en un tablero la foto es lo
 * primero que se mira: hay foto y carga, hay foto y NO carga (URL vencida, el
 * objeto se borró del bucket, no hay señal), y no hay foto. Sin el segundo
 * caso resuelto queda el ícono de imagen rota del navegador, que es el detalle
 * que más barato arruina una pantalla.
 */
function Miniatura({ inc }: { inc: BoardIncident }) {
  const [fallo, setFallo] = useState(false);
  const acento = REASON_STYLES[inc.reason]?.soft ?? 'bg-surface-3';
  const hayFoto = Boolean(inc.first_photo_url) && !fallo;

  /* Sin foto la tarjeta NO reserva el hueco de la foto.
     Con el recuadro 4:3 fijo, una incidencia sin evidencia se llevaba 260 px
     de color plano y entraban dos tarjetas por columna en vez de cinco. El
     espacio en blanco tiene que costar algo: si no hay nada que mostrar, la
     tarjeta se encoge y deja lugar a las que siguen.

     Importa más de lo que parece mientras nadie suba fotos: hoy todas las
     incidencias de la base tienen evidences_count = 0. */
  if (!hayFoto) {
    return (
      <div className={cn('flex items-center gap-1.5 px-3 py-1.5 text-ink-3', acento)}>
        <ImageOff className="h-3.5 w-3.5 opacity-55" strokeWidth={1.75} />
        <span className="text-2xs font-semibold">{fallo ? 'Foto no disponible' : 'Sin foto'}</span>
      </div>
    );
  }

  return (
    <div className={cn('relative aspect-[4/3] w-full overflow-hidden rounded-t-card', acento)}>
      <img
        src={inc.first_photo_url as string}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFallo(true)}
        className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.04]"
      />

      {/* El contador de fotos, sobre la imagen. Va con degradado abajo y no con
          una pastilla opaca: sobre una foto clara una pastilla tapa, y sobre
          una oscura desaparece. El degradado funciona con las dos. */}
      {inc.evidences_count ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/55 to-transparent p-2">
          <span className="inline-flex items-center gap-1 text-2xs font-bold text-white">
            <Camera className="h-3.5 w-3.5" strokeWidth={2.25} />
            {inc.evidences_count}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Una incidencia en el tablero.
 *
 * Jerarquía: primero la foto, después el PROVEEDOR —que es por quien se
 * pregunta ("¿qué pasó con Orion?")—, después el motivo, y recién al final el
 * número de incidencia, que sirve para buscarla pero no para reconocerla.
 * La tabla vieja tenía ese orden al revés.
 */
export const BoardCard = forwardRef<HTMLDivElement, Props>(function BoardCard(
  { inc, dragProps, fantasma, onOpen, onPhotos },
  ref,
) {
  const s = REASON_STYLES[inc.reason];

  return (
    <div
      ref={ref}
      {...dragProps}
      className={cn(
        'board-card group relative cursor-grab overflow-hidden rounded-card border border-border bg-surface text-left shadow-card',
        'transition-[box-shadow,border-color,transform] duration-200 ease-smooth',
        'hover:-translate-y-0.5 hover:border-border-strong hover:shadow-pop',
        'focus-within:ring-2 focus-within:ring-brand/35',
        fantasma && 'rotate-2 cursor-grabbing shadow-pop ring-2 ring-brand/40',
      )}
    >
      {/* La banda de color del motivo. Es lo que deja barrer una columna de
          arriba a abajo y ver de qué se trata sin leer una palabra. */}
      <span className={cn('absolute inset-y-0 left-0 z-10 w-1', s?.dot ?? 'bg-ink-3')} aria-hidden />

      <Miniatura inc={inc} />

      <div className="space-y-2.5 p-3 pl-4">
        {/* Sale la insignia de prioridad. Competía con el proveedor por el
            mismo renglón y lo obligaba a truncarse antes de tiempo, y el dato
            no se estaba usando para nada: se carga en Normal por defecto y
            casi nunca se cambia. El nombre se queda con la línea entera. */}
        <h3 className="truncate text-sm font-bold leading-tight text-ink">
          {inc.supplier_nombre ?? 'Sin proveedor'}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <ReasonBadge reason={inc.reason} />
          {inc.affected_units ? (
            <span className="chip bg-surface-3 text-ink-2">
              <Package className="h-3 w-3" strokeWidth={2.25} />
              {inc.affected_units}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <span className="truncate font-mono text-2xs font-semibold text-ink-3">
            {inc.incident_number}
          </span>
          <span className="inline-flex flex-none items-center gap-1 text-2xs font-semibold text-ink-3">
            <Clock className="h-3 w-3" strokeWidth={2.25} />
            {fmtAge(inc.created_at)}
          </span>
        </div>
      </div>

      {/* Los botones van al final del DOM y por encima en z, para que el gesto
          de arrastre —que vive en la raíz— no se coma el click. Aparecen en
          hover en escritorio y quedan siempre visibles con puntero grueso,
          donde no hay hover que valga. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end gap-1 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100">
        {inc.evidences_count ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onPhotos?.(inc)}
            className="pointer-events-auto rounded-lg border border-border bg-surface/95 px-2 py-1 text-2xs font-bold text-ink-2 backdrop-blur transition-colors hover:border-brand hover:text-brand"
          >
            Fotos
          </button>
        ) : null}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpen?.(inc)}
          className="pointer-events-auto rounded-lg bg-brand px-2 py-1 text-2xs font-bold text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          Abrir
        </button>
      </div>
    </div>
  );
});
