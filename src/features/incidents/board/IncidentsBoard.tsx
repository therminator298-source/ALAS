import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, useDraggable, useDroppable, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { Plus, RefreshCw, AlertTriangle, Inbox, Boxes, PackagePlus, PackageMinus, PackageX } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SegStrip, type SegItem } from '@/components/SegStrip';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import { PRIMARY_REASONS, REASON_LABELS, STATUS_TRANSITIONS } from '@/config/constants';
import { cn } from '@/lib/utils';
import {
  listBoard, agruparPorColumna, cambiarEstadoBoard,
  BOARD_COLUMNS, type BoardIncident, type BoardStatus, type BoardSource, type BoardFallback,
} from '@/services/board';
import { VerifyModal, ResolveModal, ConfirmActionModal } from '../workflow/WorkflowModals';
import { PhotoModal } from '../PhotoModal';
import { BoardCard } from './BoardCard';
import type { IncidentReason } from '@/types';

/* ────────────────────────────────────────────────────────────────────────────
   Qué modal abre cada destino.

   Ninguna transición se escribe sola: las RPC del servidor piden argumentos
   —verify_incident pide resultado y comentario, resolve_incident pide tipo y
   observación, close_incident pide comentario— y eso es lo que deja el
   historial auditado con quién y por qué. Un tablero que moviera tarjetas en
   silencio estaría rompiendo esa trazabilidad para ahorrar dos clics.

   EN_REVISION y la vuelta a PENDIENTE no tienen modal propio en la app, así
   que usan el genérico de acá abajo, que llama a incident_change_status —la
   misma RPC que ya valida permiso, registra historial y audita.
   ──────────────────────────────────────────────────────────────────────────── */
type Destino = 'verify' | 'resolve' | 'close' | 'reopen' | 'generico';

function modalPara(desde: BoardStatus, hasta: BoardStatus): Destino {
  if (hasta === 'VERIFICADO') return 'verify';
  if (hasta === 'EN_RESOLUCION') return 'resolve';
  if (hasta === 'TERMINADO') return 'close';
  if (hasta === 'PENDIENTE' && desde === 'TERMINADO') return 'reopen';
  return 'generico';
}

interface Pendiente {
  inc: BoardIncident;
  desde: BoardStatus;
  hasta: BoardStatus;
  destino: Destino;
}

/* ────────────────────────────────────────────────────────────────────────── */

export function IncidentsBoard() {
  const navigate = useNavigate();
  const { user } = useSession();

  const [rows, setRows] = useState<BoardIncident[]>([]);
  const [source, setSource] = useState<BoardSource>({ kind: 'live' });
  const [cargando, setCargando] = useState(true);
  const [reason, setReason] = useState<IncidentReason | null>(null);

  const [arrastrando, setArrastrando] = useState<BoardIncident | null>(null);
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [fotosDe, setFotosDe] = useState<BoardIncident | null>(null);

  const raiz = useRef<HTMLDivElement>(null);
  const primeraCarga = useRef(true);

  /* Se trae TODO una vez y el motivo se filtra acá.
     Antes cada clic en el filtro era una consulta nueva al servidor. Dos
     razones para cambiarlo, y la segunda es la que manda: el segmentado
     muestra cuántas hay de cada motivo, y esos números no se pueden saber
     mirando un resultado que ya viene filtrado —con Faltante puesto, Sobrante
     y Averiado valdrían cero y parecería que no existen—. De paso, cambiar de
     filtro pasa a ser instantáneo y no vuelve a pedir nada. */
  const cargar = useCallback(async () => {
    setCargando(true);
    const r = await listBoard(null);
    setRows(r.rows);
    setSource(r.source);
    setCargando(false);
  }, []);

  useEffect(() => {
    let vivo = true;
    listBoard(null).then((r) => {
      if (!vivo) return;
      setRows(r.rows);
      setSource(r.source);
      setCargando(false);
    });
    return () => { vivo = false; };
  }, []);

  const visibles = useMemo(
    () => (reason ? rows.filter((r) => r.reason === reason) : rows),
    [rows, reason],
  );
  const columnas = useMemo(() => agruparPorColumna(visibles), [visibles]);

  /* ── Animaciones ───────────────────────────────────────────────────────────
     Mismo lenguaje que el resto de la app: power2.out / back.out(1.6),
     duraciones cortas, stagger chico y clearProps para no dejar estilos en
     línea pegados que después peleen con el hover de Tailwind.

     useLayoutEffect y no useEffect: con useEffect las tarjetas se pintan en su
     posición final y recién después saltan al estado inicial de la animación,
     lo que se ve como un parpadeo en la primera carga. */
  useLayoutEffect(() => {
    if (cargando || !raiz.current) return;
    const ctx = gsap.context(() => {
      if (primeraCarga.current) {
        primeraCarga.current = false;
        gsap.from('.board-col', {
          opacity: 0, y: -10, duration: 0.42, stagger: 0.05,
          ease: 'back.out(1.4)', clearProps: 'all',
        });
      }
      gsap.from('.board-card', {
        opacity: 0, y: 14, scale: 0.97, duration: 0.36, stagger: 0.025,
        ease: 'power2.out', clearProps: 'all',
      });
    }, raiz);
    return () => ctx.revert();
  }, [cargando, visibles]);

  /* ── Arrastre ───────────────────────────────────────────────────────────── */
  const sensores = useSensors(
    // 6px de tolerancia: sin esto, un click con el pulso normal cuenta como
    // arrastre y los botones de la tarjeta se vuelven imposibles de apretar.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // En pantalla táctil manda el scroll: sólo después de mantener 220 ms sin
    // moverse se toma como arrastre, o desplazar la columna movería tarjetas.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(e: DragStartEvent) {
    const inc = rows.find((r) => r.id === e.active.id);
    setArrastrando(inc ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    setArrastrando(null);
    const inc = rows.find((r) => r.id === e.active.id);
    const hasta = e.over?.id as BoardStatus | undefined;
    if (!inc || !hasta) return;

    const desde = inc.status as BoardStatus;
    if (desde === hasta) return;

    // La transición se valida acá ANTES de abrir nada. incident_change_status
    // no comprueba que el salto sea legal —pone el estado que le pidas—, así
    // que si esto no filtrara, arrastrar de Pendientes a Terminados saltearía
    // la verificación entera y el historial quedaría con un agujero.
    if (!STATUS_TRANSITIONS[desde]?.includes(hasta)) {
      toast(`No se puede pasar de ${etiqueta(desde)} a ${etiqueta(hasta)} directamente.`, 'err');
      return;
    }

    setPendiente({ inc, desde, hasta, destino: modalPara(desde, hasta) });
  }

  const cerrarPendiente = () => setPendiente(null);
  const hecho = () => { setPendiente(null); cargar(); };

  /* Se estrecha una sola vez, acá, en vez de dejar que cada rama de
     AvisoConexion vuelva a preguntar de qué variante se trata. */
  const fallback: BoardFallback | null = source.kind === 'live' ? null : source;

  return (
    /* El padding lo pone la página, no el layout: .alas-model-content no trae
       ninguno, así que sin esto el título arranca debajo de la barra lateral y
       se le come la primera letra. Mismo p-5/p-6 y mismo techo de ancho que
       Proveedores y Productos, para que las tres pantallas alineen. */
    <div ref={raiz} className="flex h-full min-h-0 flex-col p-5 md:p-6">
      <PageHeader
        title="Tablero de incidencias"
        subtitle="Las más nuevas, arriba"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={cargar} disabled={cargando}>
              <RefreshCw className={cn('h-4 w-4', cargando && 'animate-spin')} strokeWidth={2.25} />
              Actualizar
            </button>
            <button className="btn-primary" onClick={() => navigate('/incidents/new')}>
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Nueva incidencia
            </button>
          </div>
        }
      />

      <FiltroMotivo valor={reason} onChange={setReason} rows={rows} />

      {fallback && <AvisoConexion source={fallback} />}

      <DndContext
        sensors={sensores}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setArrastrando(null)}
      >
        {/* Scroll horizontal: cinco columnas no entran en una notebook sin
            apretarlas hasta que la foto deje de servir. Se prefiere arrastrar
            el tablero, que es lo que hace Trello y lo que la gente espera. */}
        <div className="-mx-1 flex min-h-0 flex-1 gap-3 overflow-x-auto px-1 pb-2">
          {BOARD_COLUMNS.map((col) => (
            <Columna
              key={col.status}
              status={col.status}
              label={col.label}
              dot={col.dot}
              items={columnas[col.status] ?? []}
              cargando={cargando}
              onOpen={(i) => navigate(`/incidents/${i.incident_number}`)}
              onPhotos={setFotosDe}
            />
          ))}
        </div>

        {/* El fantasma que sigue al dedo. Va fuera de las columnas para que no
            lo recorte el overflow del contenedor. */}
        <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
          {arrastrando ? (
            <div className="w-[248px]">
              <BoardCard inc={arrastrando} fantasma />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Los modales de workflow. Son los MISMOS que usa la ficha de la
          incidencia: si mañana cambia lo que pide una verificación, cambia en
          los dos lados a la vez. */}
      {pendiente?.destino === 'verify' && (
        <VerifyModal incident={pendiente.inc} open onClose={cerrarPendiente} onDone={hecho} />
      )}
      {pendiente?.destino === 'resolve' && (
        <ResolveModal incident={pendiente.inc} open onClose={cerrarPendiente} onDone={hecho} />
      )}
      {pendiente?.destino === 'close' && (
        <ConfirmActionModal incident={pendiente.inc} kind="close" open onClose={cerrarPendiente} onDone={hecho} />
      )}
      {pendiente?.destino === 'reopen' && (
        <ConfirmActionModal incident={pendiente.inc} kind="reopen" open onClose={cerrarPendiente} onDone={hecho} />
      )}
      {pendiente?.destino === 'generico' && (
        <MoverModal
          pendiente={pendiente}
          actorId={user.id}
          onClose={cerrarPendiente}
          onDone={hecho}
        />
      )}

      <PhotoModal
        open={!!fotosDe}
        incidentId={fotosDe?.id ?? null}
        incidentNumber={fotosDe?.incident_number}
        onClose={() => setFotosDe(null)}
        onChanged={cargar}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function etiqueta(s: BoardStatus): string {
  return BOARD_COLUMNS.find((c) => c.status === s)?.label ?? s;
}

/* El ícono de cada motivo. Sobrante suma, Faltante resta, Averiado se rompe:
   la forma dice lo mismo que la palabra, así el segmentado se lee de reojo. */
const ICONO_MOTIVO: Partial<Record<IncidentReason, typeof Boxes>> = {
  SOBRANTE: PackagePlus,
  FALTANTE: PackageMinus,
  AVERIADO: PackageX,
};

const TODOS = 'TODOS';

/**
 * El filtro de motivo, con el mismo segmentado que usa Calendario para elegir
 * depósito (SegStrip). Gana tres cosas sobre las pastillas que había antes:
 * cada opción trae su contador, los segmentos se reparten el ancho en vez de
 * amontonarse a la izquierda, y son objetivos grandes para el dedo.
 *
 * Los contadores salen de `rows` SIN filtrar. Si salieran de lo que se ve, con
 * un motivo elegido los otros dos marcarían cero y parecería que no existen.
 */
function FiltroMotivo({
  valor, onChange, rows,
}: {
  valor: IncidentReason | null;
  onChange: (r: IncidentReason | null) => void;
  rows: BoardIncident[];
}) {
  const items: SegItem[] = useMemo(() => {
    const cuenta = (r: IncidentReason) => rows.filter((x) => x.reason === r).length;
    return [
      { value: TODOS, label: 'Todos', icon: Boxes, count: rows.length },
      ...PRIMARY_REASONS.map((r) => ({
        value: r,
        label: REASON_LABELS[r],
        icon: ICONO_MOTIVO[r] ?? Boxes,
        count: cuenta(r),
      })),
    ];
  }, [rows]);

  return (
    <div className="mb-3">
      <SegStrip
        equal
        inline
        items={items}
        value={valor ?? TODOS}
        onChange={(v) => onChange(v === TODOS ? null : (v as IncidentReason))}
      />
    </div>
  );
}


/** Una columna del tablero. */
function Columna({
  status, label, dot, items, cargando, onOpen, onPhotos,
}: {
  status: BoardStatus;
  label: string;
  dot: string;
  items: BoardIncident[];
  cargando: boolean;
  onOpen: (i: BoardIncident) => void;
  onPhotos: (i: BoardIncident) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      className={cn(
        /* flex-1 con piso de 248px: en pantalla ancha las cinco columnas se
           reparten todo el espacio —antes quedaban fijas en 264 y sobraban
           300px a la derecha— y en pantalla angosta dejan de achicarse y pasan
           a scrollear, que es cuando repartir sería contraproducente. */
        'board-col flex min-w-[248px] flex-1 shrink-0 basis-0 flex-col rounded-card border bg-surface-2 transition-colors duration-200',
        isOver ? 'border-brand bg-brand-soft/40' : 'border-border',
      )}
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className={cn('h-2 w-2 flex-none rounded-full', dot)} aria-hidden />
        <h2 className="min-w-0 flex-1 truncate text-2xs font-bold uppercase tracking-wide text-ink-2">
          {label}
        </h2>
        <span className="flex-none rounded-full bg-surface-3 px-2 py-0.5 text-2xs font-bold tabular-nums text-ink-2">
          {items.length}
        </span>
      </header>

      <div ref={setNodeRef} className="min-h-[120px] flex-1 space-y-2.5 overflow-y-auto p-2.5">
        {cargando ? (
          <>
            <Esqueleto /> <Esqueleto />
          </>
        ) : items.length ? (
          items.map((inc) => <TarjetaArrastrable key={inc.id} inc={inc} onOpen={onOpen} onPhotos={onPhotos} />)
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-8 text-ink-3">
            <Inbox className="h-5 w-5 opacity-45" strokeWidth={1.75} />
            <span className="text-2xs font-semibold">Sin incidencias</span>
          </div>
        )}
      </div>
    </section>
  );
}

function TarjetaArrastrable({
  inc, onOpen, onPhotos,
}: {
  inc: BoardIncident;
  onOpen: (i: BoardIncident) => void;
  onPhotos: (i: BoardIncident) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: inc.id });

  // La original se atenúa mientras el fantasma viaja, en vez de desaparecer:
  // si se quita del flujo, la columna colapsa y las demás tarjetas saltan.
  return (
    <div className={cn(isDragging && 'opacity-35')}>
      <BoardCard
        ref={setNodeRef}
        inc={inc}
        dragProps={{ ...attributes, ...listeners }}
        onOpen={onOpen}
        onPhotos={onPhotos}
      />
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="aspect-[4/3] w-full animate-pulse bg-surface-3" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-3" />
        <div className="h-5 w-1/2 animate-pulse rounded-full bg-surface-3" />
      </div>
    </div>
  );
}

/**
 * El cartel de "esto que ves no es real".
 *
 * Dice QUÉ pasó, no un "vista previa" que sirve igual para cuatro causas
 * distintas. Y es un bloque de color, no una línea gris al pie: alguien que
 * abre el tablero con mala señal tiene que enterarse antes de actuar sobre
 * una incidencia que no existe.
 */
function AvisoConexion({ source }: { source: BoardFallback }) {
  const texto =
    source.kind === 'sin-config'
      ? 'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local. Lo que ves son datos de ejemplo.'
      : source.kind === 'sin-vista'
        ? 'Falta la vista incidents_board. Corré db/incidents_board.sql en Supabase. Lo que ves son datos de ejemplo.'
        : `No se pudo leer la base: ${source.detail}. Lo que ves son datos de ejemplo.`;

  return (
    <div className="mb-3 flex items-start gap-2.5 rounded-card border border-warn/40 bg-warn/10 px-3.5 py-2.5">
      <AlertTriangle className="mt-px h-4 w-4 flex-none text-warn" strokeWidth={2.25} />
      <p className="text-xs font-semibold leading-relaxed text-ink-2">{texto}</p>
    </div>
  );
}

/** Para las transiciones que no tienen modal propio (a "En revisión", y la vuelta atrás). */
function MoverModal({
  pendiente, actorId, onClose, onDone,
}: {
  pendiente: Pendiente;
  actorId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [comentario, setComentario] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar() {
    setOcupado(true);
    try {
      await cambiarEstadoBoard(actorId, pendiente.inc.id, pendiente.hasta, comentario.trim());
      toast(`${pendiente.inc.incident_number} pasó a ${etiqueta(pendiente.hasta)}.`, 'ok');
      onDone();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Mover a ${etiqueta(pendiente.hasta)}`}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={ocupado}>Cancelar</button>
          <button className="btn-primary" onClick={enviar} disabled={ocupado}>Mover</button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-2">
        <b className="font-mono text-ink">{pendiente.inc.incident_number}</b> pasa de{' '}
        {etiqueta(pendiente.desde)} a {etiqueta(pendiente.hasta)}.
      </p>
      <span className="mb-1.5 block text-xs font-semibold text-ink-2">Comentario (opcional)</span>
      <textarea
        className="input min-h-[80px] resize-y py-2.5"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Por qué se mueve…"
      />
    </Modal>
  );
}
