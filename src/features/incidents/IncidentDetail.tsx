import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, UserPlus, Wrench, Lock, RotateCcw, Ban, Send, History, ShieldCheck, Image as ImageIcon, Printer,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReasonBadge } from '@/components/ui/ReasonBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/toast';
import {
  VerifyModal, ResolveModal, AssignModal, AnularModal, ConfirmActionModal,
} from './workflow/WorkflowModals';
import { getIncident, addComment, type IncidentDetail as Detail } from '@/services/incidentDetail';
import { useSession, can } from '@/store/session';
import { fmtAge, fmtDateTime, cn } from '@/lib/utils';
import { STATUS_LABELS } from '@/config/constants';

type ModalKind = 'verify' | 'resolve' | 'assign' | 'anular' | 'close' | 'reopen' | null;

export function IncidentDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalKind>(null);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getIncident(id).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [id]);

  useEffect(load, [load]);

  async function postComment() {
    if (!comment.trim() || !detail) return;
    setPosting(true);
    try {
      await addComment(user.id, detail.incident.id, comment.trim());
      setComment('');
      toast('Comentario agregado.', 'ok');
      load();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-ink-3">Cargando incidencia…</div>;
  }
  if (!detail) {
    return (
      <div className="p-6">
        <EmptyState title="Incidencia no encontrada" message={`No existe ${id}.`} />
      </div>
    );
  }

  const inc = detail.incident;
  const s = inc.status;
  const actions = [
    { show: s === 'PENDIENTE' || s === 'EN_REVISION', perm: 'incident.verify', label: 'Verificar', icon: CheckCircle2, onClick: () => setModal('verify'), primary: true },
    { show: s === 'VERIFICADO', perm: 'incident.resolve', label: 'Resolver', icon: Wrench, onClick: () => setModal('resolve'), primary: true },
    { show: s === 'EN_RESOLUCION', perm: 'incident.close', label: 'Marcar resuelto', icon: Lock, onClick: () => setModal('close'), primary: true },
    { show: s === 'TERMINADO', perm: 'incident.reopen', label: 'Reabrir', icon: RotateCcw, onClick: () => setModal('reopen'), primary: false },
    { show: !['TERMINADO', 'ANULADO'].includes(s), perm: 'incident.assign', label: 'Asignar', icon: UserPlus, onClick: () => setModal('assign'), primary: false },
    { show: !['ANULADO'].includes(s), perm: 'incident.delete', label: 'Anular', icon: Ban, onClick: () => setModal('anular'), primary: false, danger: true },
  ].filter((a) => a.show && can(user, a.perm as never));

  return (
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="btn-ghost h-9 px-2" aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-mono text-lg font-extrabold text-ink">{inc.incident_number}</h1>
        <StatusBadge status={inc.status} />
        <PriorityBadge priority={inc.priority} />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate(`/incidents/${inc.incident_number}/print`)}
            className="btn-secondary h-9"
          >
            <Printer className="h-4 w-4" strokeWidth={2} /> Imprimir
          </button>
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={a.onClick}
                className={cn(
                  a.primary ? 'btn-primary' : a.danger ? 'btn-secondary text-faltante hover:border-faltante' : 'btn-secondary',
                  'h-9',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} /> {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resumen */}
          <Card title="Resumen">
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Info label="Motivo"><ReasonBadge reason={inc.reason} /></Info>
              <Info label="Proveedor" value={inc.supplier_nombre ?? '—'} />
              <Info label="Factura" value={inc.invoice_number ?? '—'} mono />
              <Info label="Documento" value={inc.document_number ?? '—'} mono />
              <Info label="Fecha emisión" value={fmtDateTime(inc.emission_date)} />
              <Info label="Creado por" value={inc.created_by_nombre ?? '—'} />
              <Info label="Responsable" value={inc.assigned_to_nombre ?? 'Sin asignar'} />
              <Info label="Tiempo abierto" value={fmtAge(inc.created_at, inc.closed_at ?? undefined)} />
              <Info label="Productos" value={String(detail.items.length)} />
            </dl>
            {inc.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-1">Descripción</div>
                <p className="text-sm text-ink-2 whitespace-pre-wrap">{inc.description}</p>
              </div>
            )}
          </Card>

          {/* Productos */}
          <Card title={`Productos (${detail.items.length})`}>
            {detail.items.length === 0 ? (
              <p className="text-sm text-ink-3">Sin productos registrados.</p>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-2xs font-bold uppercase tracking-wide text-ink-3 border-b border-border">
                      <th className="px-5 py-2">Código</th>
                      <th className="px-3 py-2">Descripción</th>
                      <th className="px-3 py-2 text-right">Esperado</th>
                      <th className="px-3 py-2 text-right">Recibido</th>
                      <th className="px-3 py-2 text-right">Diferencia</th>
                      <th className="px-5 py-2">UM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detail.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-5 py-2.5 font-mono text-xs font-bold">{it.codigo}</td>
                        <td className="px-3 py-2.5">{it.descripcion}{it.observation ? <span className="block text-2xs text-ink-3">{it.observation}</span> : null}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{it.expected_qty}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{it.received_qty}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums">
                          {it.difference_qty > 0 ? '+' : ''}{it.difference_qty}
                        </td>
                        <td className="px-5 py-2.5 text-ink-3">{it.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Evidencias (upload en Fase 8) */}
          <Card title={`Evidencias (${detail.evidences.length})`}>
            {detail.evidences.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-ink-3">
                <ImageIcon className="h-4 w-4" /> Sin evidencias. La carga de fotos/archivos llega en la Fase 8.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {detail.evidences.map((e) => (
                  <a key={e.id} href={e.file_url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg border border-border overflow-hidden bg-surface-3">
                    <img src={e.file_url} alt="evidencia" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </Card>

          {/* Comentarios */}
          <Card title={`Comentarios (${detail.comments.length})`}>
            {can(user, 'incident.comment') && (
              <div className="flex gap-2 mb-4">
                <input
                  className="input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') postComment(); }}
                  placeholder="Escribí un comentario…"
                />
                <button className="btn-primary shrink-0" onClick={postComment} disabled={posting || !comment.trim()}>
                  <Send className="h-4 w-4" /> Enviar
                </button>
              </div>
            )}
            {detail.comments.length === 0 ? (
              <p className="text-sm text-ink-3">Sin comentarios.</p>
            ) : (
              <ul className="space-y-3">
                {detail.comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <div className="grid place-items-center h-8 w-8 rounded-full bg-brand-soft text-brand text-xs font-bold shrink-0">
                      {(c.user_nombre ?? '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-ink-3">
                        <span className="font-semibold text-ink-2">{c.user_nombre}</span> · {fmtDateTime(c.created_at)}
                      </div>
                      <p className="text-sm text-ink mt-0.5 whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-4">
          {/* Historial */}
          <Card title="Historial" icon={History}>
            <ol className="relative border-l border-border ml-1.5 space-y-4">
              {detail.history.map((h) => (
                <li key={h.id} className="ml-4">
                  <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                  <div className="text-xs text-ink-3">{fmtDateTime(h.created_at)}</div>
                  <div className="text-sm font-semibold text-ink">
                    {h.from_status ? `${STATUS_LABELS[h.from_status]} → ` : ''}{STATUS_LABELS[h.to_status]}
                  </div>
                  <div className="text-xs text-ink-2">{h.user_nombre}{h.comment ? ` · ${h.comment}` : ''}</div>
                </li>
              ))}
              {detail.history.length === 0 && <li className="ml-4 text-sm text-ink-3">Sin movimientos.</li>}
            </ol>
          </Card>

          {/* Auditoría */}
          <Card title="Auditoría" icon={ShieldCheck}>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {detail.audit.map((a) => (
                <li key={a.audit_id} className="text-xs border-b border-border pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-ink">{a.action}</span>
                    <span className="text-ink-3">{fmtDateTime(a.created_at)}</span>
                  </div>
                  <div className="text-ink-2">{a.user_nombre ?? '—'}</div>
                </li>
              ))}
              {detail.audit.length === 0 && <li className="text-sm text-ink-3">Sin eventos.</li>}
            </ul>
          </Card>
        </div>
      </div>

      {/* Modales de workflow */}
      <VerifyModal incident={inc} open={modal === 'verify'} onClose={() => setModal(null)} onDone={load} />
      <ResolveModal incident={inc} open={modal === 'resolve'} onClose={() => setModal(null)} onDone={load} />
      <AssignModal incident={inc} open={modal === 'assign'} onClose={() => setModal(null)} onDone={load} />
      <AnularModal incident={inc} open={modal === 'anular'} onClose={() => setModal(null)} onDone={load} />
      <ConfirmActionModal incident={inc} kind="close" open={modal === 'close'} onClose={() => setModal(null)} onDone={load} />
      <ConfirmActionModal incident={inc} kind="reopen" open={modal === 'reopen'} onClose={() => setModal(null)} onDone={load} />
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4 w-4 text-ink-3" />}
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Info({ label, value, children, mono }: { label: string; value?: string; children?: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-1">{label}</dt>
      <dd className={cn('text-sm font-semibold text-ink', mono && 'font-mono text-xs')}>{children ?? value}</dd>
    </div>
  );
}
