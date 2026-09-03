import { supabase } from '@/lib/supabase';
import type { IncidentEvidence } from '@/types';

const BUCKET = 'evidencias';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function extOf(name: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name);
  return m && m[1] ? m[1].toLowerCase() : 'bin';
}

/** Sube un archivo al bucket y registra la evidencia vía RPC (valida permiso + audita). */
export async function uploadEvidence(
  actorId: string,
  incidentId: string,
  file: File,
  comment?: string,
): Promise<IncidentEvidence> {
  if (!supabase) throw new Error('Sin conexión a Supabase.');
  if (file.size > MAX_BYTES) throw new Error('El archivo supera 10 MB.');

  const path = `${incidentId}/${crypto.randomUUID()}.${extOf(file.name)}`;
  const up = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (up.error) throw new Error(`No se pudo subir el archivo: ${up.error.message}`);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const fileUrl = pub.publicUrl;

  const { data, error } = await supabase.rpc('add_evidence', {
    p_actor: actorId,
    p_incident: incidentId,
    p_file_url: fileUrl,
    p_file_type: file.type || 'application/octet-stream',
    p_comment: comment ?? null,
  });
  if (error) {
    // rollback best-effort del objeto subido si la RPC falla
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    throw new Error(error.message);
  }
  return data as IncidentEvidence;
}

/** Borra la fila (RPC) y hace best-effort de quitar el objeto del bucket. */
export async function deleteEvidence(actorId: string, evidence: IncidentEvidence): Promise<void> {
  if (!supabase) throw new Error('Sin conexión a Supabase.');
  const { error } = await supabase.rpc('delete_evidence', {
    p_actor: actorId,
    p_evidence: evidence.id,
  });
  if (error) throw new Error(error.message);

  const marker = `/${BUCKET}/`;
  const idx = evidence.file_url.indexOf(marker);
  if (idx >= 0) {
    const path = decodeURIComponent(evidence.file_url.slice(idx + marker.length));
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
  }
}
