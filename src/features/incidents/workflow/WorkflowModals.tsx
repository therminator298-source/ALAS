import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import {
  verifyIncident, resolveIncident, closeIncident, reopenIncident, anularIncident, assignIncident, listUsers,
} from '@/services/incidentDetail';
import { useSession } from '@/store/session';
import type { Incident, User } from '@/types';

interface BaseProps {
  incident: Incident;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs font-semibold text-ink-2 mb-1.5">{children}</span>;
}

/** Verificar (sección 20) */
export function VerifyModal({ incident, open, onClose, onDone }: BaseProps) {
  const { user } = useSession();
  const [result, setResult] = useState('CONFIRMADA');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await verifyIncident(user.id, incident.id, result, comment.trim());
      toast('Incidencia verificada.', 'ok');
      onDone();
      onClose();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Verificar ${incident.incident_number}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>Confirmar verificación</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Resultado de verificación *</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'CONFIRMADA', l: 'Confirmada' },
              { v: 'PARCIAL', l: 'Parcial' },
              { v: 'NO_CORRESPONDE', l: 'No corresponde' },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setResult(o.v)}
                className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
                  result === o.v ? 'bg-brand text-white border-brand' : 'border-border text-ink-2 hover:border-border-strong'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Comentario</Label>
          <textarea className="input min-h-[80px] py-2.5 resize-y" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

const RESOLUTION_TYPES = [
  { v: 'REPOSICION', l: 'Reposición del proveedor' },
  { v: 'NOTA_CREDITO', l: 'Nota de crédito' },
  { v: 'DEVOLUCION', l: 'Devolución' },
  { v: 'AJUSTE_INVENTARIO', l: 'Ajuste de inventario' },
  { v: 'ACEPTADO_DIFERENCIA', l: 'Aceptado como diferencia' },
  { v: 'REGULARIZACION_DOCUMENTAL', l: 'Regularización documental' },
  { v: 'PRODUCTO_RECUPERADO', l: 'Producto recuperado' },
  { v: 'OTRO', l: 'Otro' },
];

/** Resolver (sección 21) */
export function ResolveModal({ incident, open, onClose, onDone }: BaseProps) {
  const { user } = useSession();
  const [type, setType] = useState('REPOSICION');
  const [obs, setObs] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await resolveIncident(user.id, incident.id, type, obs.trim());
      toast('Resolución registrada.', 'ok');
      onDone();
      onClose();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Resolver ${incident.incident_number}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>Registrar resolución</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Tipo de resolución *</Label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {RESOLUTION_TYPES.map((o) => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Observación</Label>
          <textarea className="input min-h-[80px] py-2.5 resize-y" value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

/** Asignar (sección 25) */
export function AssignModal({ incident, open, onClose, onDone }: BaseProps) {
  const { user } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [assignee, setAssignee] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) listUsers().then(setUsers);
  }, [open]);

  async function submit() {
    if (!assignee) return;
    setBusy(true);
    try {
      await assignIncident(user.id, incident.id, assignee);
      toast('Incidencia asignada.', 'ok');
      onDone();
      onClose();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Asignar ${incident.incident_number}`}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={busy || !assignee}>Asignar</button>
        </>
      }
    >
      <Label>Responsable</Label>
      <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
        <option value="">Seleccionar usuario…</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.nombre}</option>
        ))}
      </select>
    </Modal>
  );
}

/** Anular (acción crítica — secciones 32/45) */
export function AnularModal({ incident, open, onClose, onDone }: BaseProps) {
  const { user } = useSession();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!reason.trim()) {
      toast('Ingresá el motivo de anulación.', 'err');
      return;
    }
    setBusy(true);
    try {
      await anularIncident(user.id, incident.id, reason.trim());
      toast('Incidencia anulada.', 'ok');
      onDone();
      onClose();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Anular ${incident.incident_number}`}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn bg-faltante text-white hover:brightness-95" onClick={submit} disabled={busy}>
            Anular incidencia
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-2 mb-3">
        Esta acción quedará registrada en auditoría y no se puede deshacer desde la operación.
      </p>
      <Label>Motivo de anulación *</Label>
      <textarea className="input min-h-[80px] py-2.5 resize-y" value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  );
}

/** Confirmación genérica para Cerrar / Reabrir */
export function ConfirmActionModal({
  incident, open, onClose, onDone, kind,
}: BaseProps & { kind: 'close' | 'reopen' }) {
  const { user } = useSession();
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const isClose = kind === 'close';

  async function submit() {
    setBusy(true);
    try {
      if (isClose) await closeIncident(user.id, incident.id, comment.trim());
      else await reopenIncident(user.id, incident.id, comment.trim());
      toast(isClose ? 'Incidencia cerrada.' : 'Incidencia reabierta.', 'ok');
      onDone();
      onClose();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isClose ? `Cerrar ${incident.incident_number}` : `Reabrir ${incident.incident_number}`}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {isClose ? 'Marcar como resuelto' : 'Reabrir'}
          </button>
        </>
      }
    >
      <Label>Comentario final</Label>
      <textarea className="input min-h-[80px] py-2.5 resize-y" value={comment} onChange={(e) => setComment(e.target.value)} />
    </Modal>
  );
}
