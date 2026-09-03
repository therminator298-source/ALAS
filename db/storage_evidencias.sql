-- ============================================================================
--  FASE 8 — Bucket de Storage "evidencias"
--  Correr en Supabase → SQL Editor (o crear el bucket desde Storage → New bucket,
--  público, y luego correr solo las policies de abajo).
--
--  NOTA DE SEGURIDAD: mientras el front use la anon key (SSO aún no integrado),
--  el rol efectivo es "anon", así que estas policies permiten subir/leer/borrar
--  a cualquiera con la anon key — mismo modelo que el resto del módulo hasta
--  cablear Auth/SSO real. Los datos (fila + auditoría) siguen protegidos por RPC.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do nothing;

drop policy if exists evidencias_read on storage.objects;
create policy evidencias_read on storage.objects
  for select using (bucket_id = 'evidencias');

drop policy if exists evidencias_insert on storage.objects;
create policy evidencias_insert on storage.objects
  for insert with check (bucket_id = 'evidencias');

drop policy if exists evidencias_delete on storage.objects;
create policy evidencias_delete on storage.objects
  for delete using (bucket_id = 'evidencias');
