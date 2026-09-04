import { useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import { createTarea, updateTarea, deleteTarea } from './calendarioApi';
import { TAREA_ESTADOS, TAREA_PRIORIDADES, DEPOSITOS, type Tarea } from './types';

interface Props {
  open: boolean;
  tarea: Tarea | null;         // null = nueva
  defaultFecha: string;        // YYYY-MM-DD para nueva
  defaultDeposito: string;     // depósito seleccionado
  onClose: () => void;
  onSaved: () => void;
}

export function TareaFormModal({ open, tarea, defaultFecha, defaultDeposito, onClose, onSaved }: Props) {
  const { user } = useSession();
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState(defaultFecha);
  const [hora, setHora] = useState('');
  const [responsable, setResponsable] = useState('');
  const [deposito, setDeposito] = useState(defaultDeposito);
  const [prioridad, setPrioridad] = useState('NORMAL');
  const [estado, setEstado] = useState('Pendiente');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (tarea) {
      setTitulo(tarea.titulo); setFecha(tarea.fecha); setHora(tarea.hora ?? '');
      setResponsable(tarea.responsable ?? ''); setDeposito(tarea.deposito ?? defaultDeposito);
      setPrioridad(tarea.prioridad); setEstado(tarea.estado); setDescripcion(tarea.descripcion ?? '');
    } else {
      setTitulo(''); setFecha(defaultFecha); setHora(''); setResponsable(''); setDeposito(defaultDeposito);
      setPrioridad('NORMAL'); setEstado('Pendiente'); setDescripcion('');
    }
  }, [open, tarea, defaultFecha, defaultDeposito]);

  async function save() {
    if (!titulo.trim()) { toast('Poné un título.', 'err'); return; }
    if (!fecha) { toast('Elegí una fecha.', 'err'); return; }
    setSaving(true);
    const payload = {
      titulo: titulo.trim(), fecha, hora: hora || null, responsable: responsable.trim() || null,
      deposito: deposito || null, prioridad, estado, descripcion: descripcion.trim() || null, usuario: user.nombre,
    };
    try {
      if (tarea) { await updateTarea(tarea.id, payload); toast('Tarea actualizada.', 'ok'); }
      else { await createTarea(payload); toast('Tarea creada.', 'ok'); }
      onSaved();
    } catch (e) { toast((e as Error).message || 'No se pudo guardar.', 'err'); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!tarea) return;
    setSaving(true);
    try { await deleteTarea(tarea.id); toast('Tarea eliminada.', 'ok'); onSaved(); }
    catch (e) { toast((e as Error).message || 'No se pudo eliminar.', 'err'); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tarea ? 'Editar tarea' : 'Nueva tarea'}
      size="md"
      footer={
        <>
          {tarea && (
            <button className="btn-ghost mr-auto text-faltante" onClick={remove} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          )}
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            <Check className="h-4 w-4" strokeWidth={2.5} /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título *">
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="¿Qué hay que hacer?" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha *"><input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
          <Field label="Hora"><input type="time" className="input" value={hora} onChange={(e) => setHora(e.target.value)} /></Field>
          <Field label="Prioridad">
            <select className="input" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
              {TAREA_PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {TAREA_ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Depósito">
            <select className="input" value={deposito} onChange={(e) => setDeposito(e.target.value)}>
              {DEPOSITOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Responsable"><input className="input" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre del responsable" /></Field>
        </div>
        <Field label="Descripción">
          <textarea className="input min-h-[80px] py-2.5 resize-y" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle de la tarea…" />
        </Field>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
