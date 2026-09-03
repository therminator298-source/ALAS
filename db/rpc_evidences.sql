-- ============================================================================
--  FASE 8 — RPC de evidencias (SECURITY DEFINER)
--  La tabla incident_evidences tiene RLS sin policy de INSERT/DELETE:
--  la escritura pasa SOLO por estas funciones, que validan permiso + auditan.
--  Correr en Supabase → SQL Editor (después de schema.sql).
-- ============================================================================

create or replace function add_evidence(
  p_actor     uuid,
  p_incident  uuid,
  p_file_url  text,
  p_file_type text,
  p_comment   text default null
) returns incident_evidences
language plpgsql security definer set search_path = public as $$
declare v_e incident_evidences; v_num text;
begin
  if not user_has_permission(p_actor, 'evidence.upload') then
    raise exception 'Sin permiso para subir evidencias' using errcode = '42501';
  end if;
  select incident_number into v_num from incidents where id = p_incident;
  insert into incident_evidences (incident_id, file_url, file_type, uploaded_by, comment)
  values (p_incident, p_file_url, p_file_type, p_actor, p_comment)
  returning * into v_e;
  perform _audit(p_actor, 'UPLOAD', 'incidents', p_incident, v_num, null,
    jsonb_build_object('file_url', p_file_url, 'file_type', p_file_type));
  return v_e;
end; $$;

create or replace function delete_evidence(p_actor uuid, p_evidence uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_e incident_evidences; v_num text;
begin
  if not user_has_permission(p_actor, 'evidence.delete') then
    raise exception 'Sin permiso para eliminar evidencias' using errcode = '42501';
  end if;
  select * into v_e from incident_evidences where id = p_evidence;
  if not found then return; end if;
  select incident_number into v_num from incidents where id = v_e.incident_id;
  delete from incident_evidences where id = p_evidence;
  perform _audit(p_actor, 'DELETE', 'incidents', v_e.incident_id, v_num, to_jsonb(v_e), null);
end; $$;
