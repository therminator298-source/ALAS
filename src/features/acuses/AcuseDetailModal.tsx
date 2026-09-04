import { useEffect, useState } from 'react';
import { Truck, CheckCircle2, Ban, Pencil, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useSession } from '@/store/session';
import { getAcuse, changeEstado, anularAcuse } from './acuseApi';
import { estadoKey, type AcuseFull } from './types';

interface Props {
  open: boolean;
  acuseId: number | null;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (id: number) => void;
}

const ESTADO_STYLE: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  en_reparto: 'bg-blue-100 text-blue-700',
  entregado: 'bg-emerald-100 text-emerald-700',
  anulado: 'bg-slate-200 text-slate-500',
};
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', en_reparto: 'En Reparto', entregado: 'Entregado', anulado: 'Anulado' };
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export function AcuseDetailModal({ open, acuseId, onClose, onChanged, onEdit }: Props) {
  const { user } = useSession();
  const [acuse, setAcuse] = useState<AcuseFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (!open || acuseId == null) return;
    setLoading(true); setAnulando(false); setMotivo('');
    getAcuse(acuseId).then((a) => { setAcuse(a); setLoading(false); });
  }, [open, acuseId]);

  async function setEstado(estado: string) {
    if (acuseId == null) return;
    setBusy(true);
    try {
      await changeEstado(acuseId, estado, user.nombre, null, estado === 'Entregado' ? today() : null);
      toast(`Estado: ${estado}.`, 'ok');
      onChanged();
      const a = await getAcuse(acuseId); setAcuse(a);
    } catch (e) { toast((e as Error).message || 'No se pudo cambiar el estado.', 'err'); }
    finally { setBusy(false); }
  }

  async function doAnular() {
    if (acuseId == null) return;
    if (!motivo.trim()) { toast('Indicá el motivo de la anulación.', 'err'); return; }
    setBusy(true);
    try {
      await anularAcuse(acuseId, user.nombre, motivo.trim());
      toast('Acuse anulado.', 'ok');
      onChanged();
      const a = await getAcuse(acuseId); setAcuse(a); setAnulando(false); setMotivo('');
    } catch (e) { toast((e as Error).message || 'No se pudo anular.', 'err'); }
    finally { setBusy(false); }
  }

  const k = estadoKey(acuse?.estado);
  const canEdit = k !== 'anulado' && k !== 'entregado';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={acuse?.nro_acuse ?? 'Acuse'}
      eyebrow="Acuse de recibo"
      subtitle={acuse?.cliente_nombre ?? undefined}
      size="lg"
      footer={
        <>
          {acuse && k !== 'anulado' && (
            <button className="btn-ghost mr-auto text-faltante" onClick={() => setAnulando((v) => !v)} disabled={busy || k === 'entregado'}>
              <Ban className="h-4 w-4" /> Anular
            </button>
          )}
          {acuse && canEdit && (
            <button className="btn-secondary" onClick={() => onEdit(acuse.id)} disabled={busy}>
              <Pencil className="h-4 w-4" /> Editar
            </button>
          )}
          {acuse && k === 'pendiente' && (
            <button className="btn-secondary" onClick={() => setEstado('En Reparto')} disabled={busy}>
              <Truck className="h-4 w-4" /> En Reparto
            </button>
          )}
          {acuse && (k === 'pendiente' || k === 'en_reparto') && (
            <button className="btn-primary" onClick={() => setEstado('Entregado')} disabled={busy}>
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} /> Entregado
            </button>
          )}
        </>
      }
    >
      {loading || !acuse ? (
        <div className="py-10 text-center text-sm text-ink-3">Cargando acuse…</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={cn('chip h-7 px-3 text-xs font-bold', ESTADO_STYLE[k])}>{ESTADO_LABEL[k]}</span>
            <span className="text-2xs text-ink-3">Emitido {fmt(acuse.fecha_emision)} · Entrega {fmt(acuse.fecha_entrega)}</span>
          </div>

          {/* Motivo de anulación (inline) */}
          {anulando && (
            <div className="card p-3 border-faltante/40 bg-faltante/5">
              <span className="block text-xs font-semibold text-faltante mb-1.5">Motivo de anulación *</span>
              <div className="flex gap-2">
                <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: pedido cancelado por el cliente" />
                <button className="btn-primary bg-faltante border-faltante" onClick={doAnular} disabled={busy}>Confirmar</button>
              </div>
            </div>
          )}

          {/* Datos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Info label="Cliente" value={acuse.cliente_nombre ?? acuse.cod_cliente} />
            <Info label="RUC" value={acuse.cliente_ruc} />
            <Info label="Ciudad" value={acuse.cliente_ciudad} />
            <Info label="Zona" value={acuse.zona} />
            <Info label="Dirección" value={acuse.cliente_direccion} />
            <Info label="Teléfono" value={acuse.cliente_telefono} />
            <Info label="Repartidor" value={acuse.repartidor_nombre} />
            <Info label="Usuario" value={acuse.usuario} />
          </div>

          {/* Detalle */}
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-ink-2 mb-2">Detalle ({acuse.items} ítems · {acuse.unidades} unid.)</div>
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-3 text-left text-2xs font-bold uppercase tracking-wide text-ink-3">
                    <th className="px-3 py-2">Código</th><th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2 text-right">Cant.</th><th className="px-3 py-2">UM</th><th className="px-3 py-2">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {acuse.detalles.map((d, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-xs font-bold">{d.cod_mercaderia}</td>
                      <td className="px-3 py-2 max-w-[240px] truncate">{d.descripcion}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{d.cantidad}</td>
                      <td className="px-3 py-2 text-ink-3">{d.um}</td>
                      <td className="px-3 py-2 text-ink-3">{d.nota ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {acuse.observacion && (
            <div><div className="text-xs font-extrabold uppercase tracking-wide text-ink-2 mb-1">Observación</div><p className="text-sm text-ink-2">{acuse.observacion}</p></div>
          )}

          {/* Historial */}
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-ink-2 mb-2">Historial</div>
            <ol className="space-y-1.5">
              {acuse.historial.map((h) => (
                <li key={h.id} className="flex items-start gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-ink-3 mt-0.5 shrink-0" />
                  <span className="text-ink-2"><b className="text-ink">{h.estado}</b> · {fmt(h.created_at)} · {h.usuario ?? 'Sistema'}{h.observacion ? ` — ${h.observacion}` : ''}</span>
                </li>
              ))}
              {acuse.historial.length === 0 && <li className="text-sm text-ink-3">Sin movimientos.</li>}
            </ol>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-2xs font-bold uppercase tracking-wide text-ink-3">{label}</div>
      <div className="text-sm font-semibold text-ink truncate">{value || '—'}</div>
    </div>
  );
}
