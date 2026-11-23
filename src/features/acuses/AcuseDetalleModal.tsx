import { useEffect, useState } from 'react';
import { Ban, Pencil, Printer, Truck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import { cn, fmtDate, fmtDateTime } from '@/lib/utils';
import { AcuseEstadoBadge } from './AcuseEstadoBadge';
import { anularAcuse, changeEstado, getAcuse } from './acuseApi';
import { estadoKey } from './types';
import type { AcuseFull } from './types';

function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* La vista de impresión A4 del proyecto embebido lee de sessionStorage con los
   nombres de columna del MySQL viejo. Reusarla es mejor que rehacer el A4: el
   formato ya está probado y es el que el cliente firma. Su otro camino
   (fetch a /api/acuses/:id) no existe en este despliegue, no hay Express. */
const CLAVE_IMPRESION = 'alas.session.acuse.print';

function paraImprimir(a: AcuseFull) {
  return {
    ID_Acuse: a.id,
    Nro_Acuse: a.nro_acuse,
    /* Las dos grafías de la fecha a propósito: la hoja tiene DOS implementaciones
       de poblarPagina y la que gana es la de acuse-print.js, que lee
       `Fecha_Emision`; la de respaldo, dentro del HTML, lee `Fec_Emision`. Con
       una sola, la hoja salía con la fecha de emisión en blanco. */
    Fecha_Emision: a.fecha_emision,
    Fec_Emision: a.fecha_emision,
    Fecha_Creacion: a.created_at,
    Cod_Cliente: a.cod_cliente,
    Nom_Cliente: a.cliente_nombre,
    Ruc_Cliente: a.cliente_ruc,
    Telef_Cliente: a.cliente_telefono,
    Telefono_Cliente: a.cliente_telefono,
    Direc_Cliente: a.cliente_direccion,
    Ciudad_Cliente: a.cliente_ciudad,
    Zona_Cliente: a.zona,
    Zona: a.zona,
    Estado: a.estado,
    Observacion: a.observacion,
    Nombre_Repartidor: a.repartidor_nombre,
    detalles: a.detalles.map((d) => ({
      Material_SAP: d.cod_mercaderia,
      Descr_SAP: d.descripcion,
      Nota_Detalle: d.nota,
      UM_SAP: d.um,
      Cantidad: d.cantidad,
    })),
  };
}

type Panel = null | 'reparto' | 'entrega' | 'anular';

export function AcuseDetalleModal({
  open, acuseId, onClose, onEditar, onChanged,
}: {
  open: boolean;
  acuseId: number | null;
  onClose: () => void;
  onEditar: (id: number) => void;
  onChanged: () => void;
}) {
  const { user } = useSession();
  const [acuse, setAcuse] = useState<AcuseFull | null>(null);
  const [cargando, setCargando] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [motivo, setMotivo] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(hoyLocal());
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    if (!open || acuseId == null) return;
    setPanel(null); setMotivo(''); setFechaEntrega(hoyLocal());
    setCargando(true);
    getAcuse(acuseId).then((a) => { setAcuse(a); setCargando(false); });
  }, [open, acuseId]);

  async function recargar() {
    if (acuseId == null) return;
    const a = await getAcuse(acuseId);
    setAcuse(a);
    onChanged();
  }

  async function aEnReparto() {
    if (acuseId == null) return;
    setTrabajando(true);
    try {
      await changeEstado(acuseId, 'En Reparto', user?.nombre ?? null, motivo || 'Sale a reparto');
      toast('El acuse salió a reparto', 'ok');
      setPanel(null); setMotivo('');
      await recargar();
    } catch (e) { toast('No se pudo cambiar el estado: ' + (e as Error).message, 'err'); }
    finally { setTrabajando(false); }
  }

  async function aEntregado() {
    if (acuseId == null) return;
    if (!fechaEntrega) { toast('Poné la fecha de entrega', 'err'); return; }
    setTrabajando(true);
    try {
      await changeEstado(acuseId, 'Entregado', user?.nombre ?? null, motivo || 'Entregado al cliente', fechaEntrega);
      toast('Acuse marcado como entregado', 'ok');
      setPanel(null); setMotivo('');
      await recargar();
    } catch (e) { toast('No se pudo cambiar el estado: ' + (e as Error).message, 'err'); }
    finally { setTrabajando(false); }
  }

  async function anular() {
    if (acuseId == null) return;
    if (motivo.trim().length < 4) { toast('Escribí el motivo de la anulación', 'err'); return; }
    setTrabajando(true);
    try {
      await anularAcuse(acuseId, user?.nombre ?? null, motivo.trim());
      toast('Acuse anulado', 'ok');
      setPanel(null); setMotivo('');
      await recargar();
    } catch (e) { toast('No se pudo anular: ' + (e as Error).message, 'err'); }
    finally { setTrabajando(false); }
  }

  function imprimir() {
    if (!acuse) return;
    try {
      sessionStorage.setItem(CLAVE_IMPRESION, JSON.stringify(paraImprimir(acuse)));
    } catch {
      toast('El navegador no dejó preparar la impresión', 'err');
      return;
    }
    /* SIN noopener a proposito: una pestaña abierta con noopener NO hereda el
       sessionStorage del que la abrio, y ahi es justo donde dejamos los datos
       del acuse. Con noopener la hoja salia en blanco ("Sin datos"). Es una
       pagina propia y del mismo origen, asi que window.opener no agrega riesgo. */
    window.open('/acuse/views/acuse-imprimir.html?autoprint=1', '_blank');
  }

  const k = acuse ? estadoKey(acuse.estado) : 'pendiente';
  const anulado = k === 'anulado';
  const unidades = acuse?.detalles.reduce((a, d) => a + (Number(d.cantidad) || 0), 0) ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow="Acuses"
      title={acuse ? `Acuse ${acuse.nro_acuse}` : 'Acuse'}
      subtitle={acuse ? `Emitido el ${fmtDate(acuse.fecha_emision)}${acuse.usuario ? ' por ' + acuse.usuario : ''}` : undefined}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <button className="btn-secondary" onClick={imprimir} disabled={!acuse}>
            <Printer className="h-4 w-4" strokeWidth={2.2} /> Imprimir
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {!anulado && (
              <>
                <button className="btn-ghost text-rose-600 hover:bg-rose-50" onClick={() => { setPanel('anular'); setMotivo(''); }} disabled={!acuse}>
                  <Ban className="h-4 w-4" strokeWidth={2.2} /> Anular
                </button>
                <button className="btn-secondary" onClick={() => acuse && onEditar(acuse.id)} disabled={!acuse}>
                  <Pencil className="h-4 w-4" strokeWidth={2.2} /> Editar
                </button>
                {k === 'pendiente' && (
                  <button className="btn-primary" onClick={() => { setPanel('reparto'); setMotivo(''); }}>
                    <Truck className="h-4 w-4" strokeWidth={2.2} /> Sacar a reparto
                  </button>
                )}
                {k === 'en_reparto' && (
                  <button className="btn-primary" onClick={() => { setPanel('entrega'); setMotivo(''); }}>
                    Marcar entregado
                  </button>
                )}
              </>
            )}
            {anulado && <span className="text-2xs font-bold text-ink-3">Un acuse anulado no se modifica</span>}
          </div>
        </div>
      }
    >
      {cargando || !acuse ? (
        <div className="grid place-items-center py-16"><span className="alas-boot" role="status" aria-label="Cargando" /></div>
      ) : (
        <div className="space-y-5">
          {/* Panel de confirmación, en línea: un modal arriba de otro se come la pantalla */}
          {panel && (
            <section className={cn('rounded-lg border p-3', panel === 'anular' ? 'border-rose-200 bg-rose-50' : 'border-brand/30 bg-brand-soft')}>
              <h3 className="text-sm font-bold text-ink mb-2">
                {panel === 'anular' ? 'Anular el acuse' : panel === 'reparto' ? 'Sacar a reparto' : 'Marcar como entregado'}
              </h3>
              {panel === 'entrega' && (
                <label className="block mb-2">
                  <span className="block text-2xs font-bold uppercase tracking-wide text-ink-3 mb-1">Fecha de entrega</span>
                  <input type="date" className="input max-w-[180px]" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
                </label>
              )}
              <textarea
                className="input h-16 py-2 resize-none"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={panel === 'anular' ? 'Motivo de la anulación (obligatorio)…' : 'Observación (opcional)…'}
                aria-label={panel === 'anular' ? 'Motivo de la anulación' : 'Observación'}
              />
              {panel === 'anular' && (
                <p className="mt-2 text-2xs text-ink-2">
                  El acuse queda sin efecto y deja de contar en los totales. No se borra: la base no permite
                  borrar desde la aplicación, queda con su historial para auditoría.
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button className="btn-ghost h-8 px-3 text-xs" onClick={() => setPanel(null)} disabled={trabajando}>Cancelar</button>
                <button
                  className={cn('h-8 px-3 text-xs', panel === 'anular' ? 'btn bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary')}
                  disabled={trabajando}
                  onClick={panel === 'anular' ? anular : panel === 'reparto' ? aEnReparto : aEntregado}
                >
                  {trabajando ? 'Guardando…' : panel === 'anular' ? 'Anular' : 'Confirmar'}
                </button>
              </div>
            </section>
          )}

          {/* Cabecera */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <Dato etiqueta="Estado"><AcuseEstadoBadge estado={acuse.estado} /></Dato>
            <Dato etiqueta="Repartidor">{acuse.repartidor_nombre ?? 'Sin asignar'}</Dato>
            <Dato etiqueta="Cliente">
              <span className="font-bold text-ink">{acuse.cliente_nombre ?? acuse.cod_cliente ?? '—'}</span>
              <span className="block text-2xs text-ink-3">
                {[acuse.cod_cliente, acuse.cliente_ruc].filter(Boolean).join(' · ') || '—'}
              </span>
            </Dato>
            <Dato etiqueta="Destino">
              {[acuse.cliente_direccion, acuse.cliente_ciudad, acuse.zona].filter(Boolean).join(' · ') || '—'}
            </Dato>
            <Dato etiqueta="Entrega">{fmtDate(acuse.fecha_entrega)}</Dato>
            <Dato etiqueta="Teléfono">{acuse.cliente_telefono ?? '—'}</Dato>
            {acuse.observacion && <Dato etiqueta="Observación" ancho>{acuse.observacion}</Dato>}
          </section>

          {/* Mercaderías */}
          <section>
            <h3 className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-2">
              Mercaderías · {acuse.detalles.length} ítem(s) · {unidades} unidades
            </h3>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-3 border-b border-border text-left">
                    <th className="px-3 py-2 text-2xs font-bold uppercase tracking-wide text-ink-3">Código</th>
                    <th className="px-3 py-2 text-2xs font-bold uppercase tracking-wide text-ink-3">Descripción</th>
                    <th className="px-3 py-2 text-2xs font-bold uppercase tracking-wide text-ink-3">UM</th>
                    <th className="px-3 py-2 text-2xs font-bold uppercase tracking-wide text-ink-3 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {acuse.detalles.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-4 text-center text-ink-3">Sin mercaderías cargadas</td></tr>
                  )}
                  {acuse.detalles.map((d, i) => (
                    <tr key={d.id ?? i} className="h-10">
                      <td className="px-3 font-mono text-xs text-ink-2 whitespace-nowrap">{d.cod_mercaderia}</td>
                      <td className="px-3 text-ink">{d.descripcion ?? '—'}{d.nota ? <span className="block text-2xs text-ink-3">{d.nota}</span> : null}</td>
                      <td className="px-3 text-ink-2">{d.um ?? '—'}</td>
                      <td className="px-3 text-right font-mono font-semibold tabular-nums">{d.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Historial */}
          <section>
            <h3 className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-2">Historial</h3>
            {acuse.historial.length === 0 ? (
              <p className="text-sm text-ink-3">Sin movimientos registrados.</p>
            ) : (
              <ol className="space-y-2">
                {acuse.historial.map((h) => (
                  <li key={h.id} className="flex items-start gap-3">
                    <AcuseEstadoBadge estado={h.estado} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 text-sm">
                      <div className="text-ink-2">{h.observacion ?? '—'}</div>
                      <div className="text-2xs text-ink-3">
                        {fmtDateTime(h.created_at)}{h.usuario ? ' · ' + h.usuario : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

function Dato({ etiqueta, children, ancho }: { etiqueta: string; children: React.ReactNode; ancho?: boolean }) {
  return (
    <div className={cn('min-w-0', ancho && 'sm:col-span-2')}>
      <span className="block text-2xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">{etiqueta}</span>
      <div className="text-sm text-ink-2">{children}</div>
    </div>
  );
}
