import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, ImageOff, ChevronLeft, ChevronRight, Loader2, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/store/session';
import { listEvidences, uploadEvidence, deleteEvidence } from '@/services/evidences';
import { fmtDateTime, cn } from '@/lib/utils';
import type { IncidentEvidence } from '@/types';

interface PhotoModalProps {
  open: boolean;
  onClose: () => void;
  incidentId: string | null;
  incidentNumber?: string;
  /** Se dispara tras subir o borrar (para refrescar contadores en la lista). */
  onChanged?: () => void;
}

const isImg = (e: IncidentEvidence) => (e.file_type || '').startsWith('image/');

export function PhotoModal({ open, onClose, incidentId, incidentNumber, onChanged }: PhotoModalProps) {
  const { user } = useSession();
  const [items, setItems] = useState<IncidentEvidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [idx, setIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    if (!incidentId) return;
    setLoading(true);
    try {
      const rows = await listEvidences(incidentId);
      setItems(rows);
      setIdx((i) => Math.min(i, Math.max(0, rows.length - 1)));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudieron cargar las fotos', 'err');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (open && incidentId) {
      setIdx(0);
      void reload();
    } else if (!open) {
      setItems([]);
    }
  }, [open, incidentId, reload]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !incidentId) return;
    if (!file.type.startsWith('image/')) {
      toast('Elegí una imagen (foto de evidencia).', 'err');
      return;
    }
    setBusy(true);
    try {
      await uploadEvidence(user.id, incidentId, file);
      toast('Foto agregada ✓', 'ok');
      await reload();
      onChanged?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo subir la foto', 'err');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (ev: IncidentEvidence) => {
    if (!window.confirm('¿Eliminar esta foto de evidencia?')) return;
    setBusy(true);
    try {
      await deleteEvidence(user.id, ev);
      toast('Foto eliminada', 'ok');
      await reload();
      onChanged?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo eliminar', 'err');
    } finally {
      setBusy(false);
    }
  };

  const current = items[idx] ?? null;
  const go = (d: number) => setIdx((i) => (items.length ? (i + d + items.length) % items.length : 0));

  const addBtn = (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      <button
        type="button"
        className="btn-primary"
        disabled={busy || !incidentId}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" strokeWidth={2.4} />}
        Agregar foto
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow={incidentNumber ? `Incidencia ${incidentNumber}` : undefined}
      title="Fotos de evidencia"
      subtitle={loading ? 'Cargando…' : `${items.length} archivo${items.length === 1 ? '' : 's'}`}
      footer={<div className="flex items-center justify-between gap-3 w-full">
        <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
        {addBtn}
      </div>}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-3">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
          <span className="text-sm font-semibold">Cargando fotos…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <div className="grid place-items-center h-16 w-16 rounded-2xl bg-brand-soft text-brand">
            <ImageOff className="h-8 w-8" strokeWidth={1.7} />
          </div>
          <h4 className="text-base font-extrabold text-ink">Sin fotos todavía</h4>
          <p className="text-sm text-ink-3 max-w-xs">Agregá una foto de evidencia para documentar la incidencia.</p>
          <div className="mt-1">{addBtn}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Visor principal */}
          <div className="relative rounded-2xl overflow-hidden bg-surface-3 border border-border grid place-items-center min-h-[300px] max-h-[56vh]">
            {current && isImg(current) ? (
              <img src={current.file_url} alt="Evidencia" className="max-h-[56vh] w-auto object-contain" />
            ) : (
              <a href={current?.file_url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 py-16 text-ink-2 hover:text-brand">
                <FileText className="h-12 w-12" strokeWidth={1.4} />
                <span className="text-sm font-semibold inline-flex items-center gap-1">Abrir archivo <ExternalLink className="h-3.5 w-3.5" /></span>
              </a>
            )}
            {items.length > 1 && (
              <>
                <button type="button" aria-label="Anterior" onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full bg-black/45 text-white hover:bg-black/65 transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" aria-label="Siguiente" onClick={() => go(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full bg-black/45 text-white hover:bg-black/65 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/55 text-white text-2xs font-bold tabular-nums">
                  {idx + 1} / {items.length}
                </span>
              </>
            )}
            {current && (
              <button type="button" onClick={() => onDelete(current)} disabled={busy}
                className="absolute top-3 right-3 grid place-items-center h-9 w-9 rounded-full bg-black/45 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                aria-label="Eliminar foto">
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Meta */}
          {current && (
            <p className="text-2xs text-ink-3 text-center">
              Subida por <span className="font-semibold text-ink-2">{current.uploaded_by_nombre || '—'}</span> · {fmtDateTime(current.created_at)}
              {current.comment ? ` · ${current.comment}` : ''}
            </p>
          )}

          {/* Miniaturas */}
          {items.length > 1 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {items.map((ev, i) => (
                <button key={ev.id} type="button" onClick={() => setIdx(i)}
                  className={cn('h-14 w-14 rounded-lg overflow-hidden border-2 transition-all', i === idx ? 'border-brand scale-105' : 'border-border opacity-70 hover:opacity-100')}>
                  {isImg(ev)
                    ? <img src={ev.file_url} alt="" className="h-full w-full object-cover" />
                    : <span className="grid place-items-center h-full w-full bg-surface-3 text-ink-3"><FileText className="h-5 w-5" /></span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
