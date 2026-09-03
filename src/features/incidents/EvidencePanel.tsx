import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, FileText, X, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { uploadEvidence, deleteEvidence } from '@/services/evidences';
import { useSession, can } from '@/store/session';
import { fmtDateTime } from '@/lib/utils';
import type { IncidentEvidence } from '@/types';

interface Props {
  incidentId: string;
  evidences: IncidentEvidence[];
  onChange: () => void;
}

export function EvidencePanel({ incidentId, evidences, onChange }: Props) {
  const { user } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const canUpload = can(user, 'evidence.upload');
  const canDelete = can(user, 'evidence.delete');

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadEvidence(user.id, incidentId, file);
        ok++;
      } catch (e) {
        toast((e as Error).message, 'err');
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    if (ok > 0) {
      toast(`${ok} evidencia${ok === 1 ? '' : 's'} agregada${ok === 1 ? '' : 's'}.`, 'ok');
      onChange();
    }
  }

  async function remove(e: IncidentEvidence) {
    if (!confirm('¿Eliminar esta evidencia?')) return;
    try {
      await deleteEvidence(user.id, e);
      toast('Evidencia eliminada.', 'ok');
      onChange();
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  }

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="h-4 w-4 text-ink-3" />
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-2">
          Evidencias ({evidences.length})
        </h2>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <button
              className="btn-secondary h-8 px-3 text-xs ml-auto"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" strokeWidth={2} />}
              {uploading ? 'Subiendo…' : 'Agregar'}
            </button>
          </>
        )}
      </div>

      {evidences.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <ImageIcon className="h-4 w-4" />
          {canUpload ? 'Sin evidencias. Tocá "Agregar" para subir fotos o PDF (cámara en móvil).' : 'Sin evidencias.'}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {evidences.map((e) => {
            const isImg = (e.file_type ?? '').startsWith('image/');
            return (
              <div key={e.id} className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-surface-3">
                {isImg ? (
                  <button onClick={() => setLightbox(e.file_url)} className="w-full h-full" title={fmtDateTime(e.created_at)}>
                    <img src={e.file_url} alt="evidencia" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ) : (
                  <a
                    href={e.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-full flex flex-col items-center justify-center gap-1 text-ink-3"
                    title={fmtDateTime(e.created_at)}
                  >
                    <FileText className="h-7 w-7" />
                    <span className="text-2xs font-semibold">Archivo</span>
                  </a>
                )}
                {canDelete && (
                  <button
                    onClick={() => remove(e)}
                    className="absolute top-1 right-1 grid place-items-center h-6 w-6 rounded-md bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-critical"
                    aria-label="Eliminar evidencia"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" aria-label="Cerrar">
            <X className="h-7 w-7" />
          </button>
          <img src={lightbox} alt="evidencia" className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain" />
        </div>
      )}
    </section>
  );
}
