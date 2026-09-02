-- ============================================================================
--  INCIDENCIAS DE RECEPCIÓN — Esquema Supabase / PostgreSQL
--  Correr UNA vez en: Supabase → SQL Editor (proyecto dedicado de Incidencias).
--  Modelo: SSO del Launcher + anon key en el cliente; TODA escritura pasa por
--  RPCs SECURITY DEFINER que validan permisos (jamás la clave de servicio en el front).
--  Idempotente donde es posible (IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ============================================================================
-- 1. LOOKUPS
-- ============================================================================

-- Motivos de incidencia (extensible sin migración: basta insertar filas)
create table if not exists incident_reasons (
  code   text primary key,
  label  text not null,
  color  text,
  active boolean not null default true,
  sort   int not null default 100
);

insert into incident_reasons (code, label, color, sort) values
  ('SOBRANTE',                 'Sobrante',                 '#2563eb', 1),
  ('FALTANTE',                 'Faltante',                 '#dc2626', 2),
  ('AVERIADO',                 'Averiado',                 '#ea580c', 3),
  ('PRODUCTO_INCORRECTO',      'Producto incorrecto',      null, 10),
  ('EMBALAJE_DANADO',          'Embalaje dañado',          null, 11),
  ('LOTE_INCORRECTO',          'Lote incorrecto',          null, 12),
  ('VENCIMIENTO',              'Vencimiento',              null, 13),
  ('DOCUMENTACION_INCORRECTA', 'Documentación incorrecta', null, 14),
  ('DIFERENCIA_PRECIO',        'Diferencia de precio',     null, 15),
  ('ERROR_PROVEEDOR',          'Error de proveedor',       null, 16),
  ('MERCADERIA_RECHAZADA',     'Mercadería rechazada',     null, 17),
  ('SIN_FACTURA',              'Sin factura',              null, 18),
  ('OTRO',                     'Otro',                     null, 99)
on conflict (code) do nothing;

-- Estados válidos (ligados al workflow; los cambios se validan en RPC)
create table if not exists incident_statuses (
  code  text primary key,
  label text not null,
  sort  int not null default 100
);
insert into incident_statuses (code, label, sort) values
  ('BORRADOR','Borrador',1), ('PENDIENTE','Pendiente',2), ('EN_REVISION','En revisión',3),
  ('VERIFICADO','Verificado',4), ('EN_RESOLUCION','En resolución',5), ('TERMINADO','Terminado',6),
  ('RECHAZADO','Rechazado',7), ('ANULADO','Anulado',8), ('BLOQUEADO','Bloqueado',9)
on conflict (code) do nothing;

-- ============================================================================
-- 2. RBAC
-- ============================================================================
create table if not exists roles (
  code  text primary key,
  label text not null
);
insert into roles (code, label) values
  ('ADMIN','Administrador'),
  ('JEFE_LOGISTICA','Jefe de Logística'),
  ('SUPERVISOR_RECEPCION','Supervisor de Recepción'),
  ('OPERADOR_RECEPCION','Operador de Recepción'),
  ('COMPRAS','Compras'),
  ('AUDITOR','Auditor')
on conflict (code) do nothing;

create table if not exists permissions (
  code text primary key
);
insert into permissions (code) values
  ('incident.create'),('incident.read'),('incident.update'),('incident.delete'),
  ('incident.verify'),('incident.resolve'),('incident.close'),('incident.reopen'),
  ('incident.assign'),('incident.comment'),('evidence.upload'),('evidence.delete'),
  ('report.view'),('report.export'),('audit.view'),('configuration.manage')
on conflict (code) do nothing;

create table if not exists role_permissions (
  role_code       text not null references roles(code) on delete cascade,
  permission_code text not null references permissions(code) on delete cascade,
  primary key (role_code, permission_code)
);

-- Matriz de permisos (espejo de src/config/constants.ts)
insert into role_permissions (role_code, permission_code)
select 'ADMIN', code from permissions
on conflict do nothing;

insert into role_permissions (role_code, permission_code) values
  ('JEFE_LOGISTICA','incident.read'),('JEFE_LOGISTICA','incident.update'),
  ('JEFE_LOGISTICA','incident.verify'),('JEFE_LOGISTICA','incident.resolve'),
  ('JEFE_LOGISTICA','incident.close'),('JEFE_LOGISTICA','incident.reopen'),
  ('JEFE_LOGISTICA','incident.assign'),('JEFE_LOGISTICA','incident.comment'),
  ('JEFE_LOGISTICA','evidence.upload'),('JEFE_LOGISTICA','report.view'),
  ('JEFE_LOGISTICA','report.export'),('JEFE_LOGISTICA','audit.view'),

  ('SUPERVISOR_RECEPCION','incident.create'),('SUPERVISOR_RECEPCION','incident.read'),
  ('SUPERVISOR_RECEPCION','incident.update'),('SUPERVISOR_RECEPCION','incident.verify'),
  ('SUPERVISOR_RECEPCION','incident.assign'),('SUPERVISOR_RECEPCION','incident.comment'),
  ('SUPERVISOR_RECEPCION','evidence.upload'),('SUPERVISOR_RECEPCION','report.view'),

  ('OPERADOR_RECEPCION','incident.create'),('OPERADOR_RECEPCION','incident.read'),
  ('OPERADOR_RECEPCION','incident.comment'),('OPERADOR_RECEPCION','evidence.upload'),

  ('COMPRAS','incident.read'),('COMPRAS','incident.comment'),('COMPRAS','report.view'),

  ('AUDITOR','incident.read'),('AUDITOR','report.view'),
  ('AUDITOR','report.export'),('AUDITOR','audit.view')
on conflict do nothing;

-- ============================================================================
-- 3. USUARIOS + CATÁLOGOS
-- ============================================================================
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  auth_uid   uuid unique,                 -- mapeo opcional a Supabase Auth
  nombre     text not null,
  rol        text not null references roles(code),
  activo     boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists suppliers (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  ruc        text,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_suppliers_nombre on suppliers using gin (to_tsvector('spanish', nombre));

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,
  descripcion text not null,
  ean         text,
  sku         text,
  um          text not null default 'UN',
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_products_codigo on products (codigo);
create index if not exists idx_products_search on products using gin (to_tsvector('spanish', codigo || ' ' || descripcion));

create table if not exists warehouses (
  id     uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text,
  activo boolean not null default true
);

-- ============================================================================
-- 4. INCIDENCIAS
-- ============================================================================
create table if not exists incidents (
  id              uuid primary key default gen_random_uuid(),
  incident_number text not null unique,                 -- INC-2026-000196
  document_number text,
  invoice_number  text,
  supplier_id     uuid references suppliers(id),
  warehouse_id    uuid references warehouses(id),
  reason          text not null references incident_reasons(code),
  status          text not null default 'PENDIENTE' references incident_statuses(code),
  priority        text not null default 'NORMAL' check (priority in ('BAJA','NORMAL','ALTA','CRITICA')),
  description     text check (char_length(description) <= 2000),
  created_by      uuid not null references users(id),
  assigned_to     uuid references users(id),
  emission_date   timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  verified_at     timestamptz,
  resolved_at     timestamptz,
  closed_at       timestamptz,
  -- soft delete (sección 32)
  deleted_at      timestamptz,
  deleted_by      uuid references users(id),
  delete_reason   text
);
create index if not exists idx_incidents_status   on incidents (status) where deleted_at is null;
create index if not exists idx_incidents_supplier on incidents (supplier_id);
create index if not exists idx_incidents_reason    on incidents (reason);
create index if not exists idx_incidents_created   on incidents (created_at desc);
create index if not exists idx_incidents_invoice   on incidents (invoice_number);
create index if not exists idx_incidents_assigned  on incidents (assigned_to);

create table if not exists incident_items (
  id            uuid primary key default gen_random_uuid(),
  incident_id   uuid not null references incidents(id) on delete cascade,
  product_id    uuid references products(id),
  codigo        text not null,
  descripcion   text not null,
  expected_qty  numeric not null default 0,
  received_qty  numeric not null default 0,
  affected_qty  numeric not null default 0,
  difference_qty numeric not null default 0,
  unit          text not null default 'UN',
  lot           text,
  observation   text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_items_incident on incident_items (incident_id);
create index if not exists idx_items_product  on incident_items (product_id);

create table if not exists incident_status_history (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  from_status text,
  to_status   text not null,
  user_id     uuid not null references users(id),
  comment     text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_history_incident on incident_status_history (incident_id, created_at);

create table if not exists incident_comments (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  user_id     uuid not null references users(id),
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_comments_incident on incident_comments (incident_id, created_at);

create table if not exists incident_evidences (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  file_url    text not null,
  file_type   text not null,
  uploaded_by uuid not null references users(id),
  comment     text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_evidences_incident on incident_evidences (incident_id);

create table if not exists incident_assignments (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  assigned_by uuid not null references users(id),
  assigned_to uuid not null references users(id),
  created_at  timestamptz not null default now()
);

create table if not exists incident_resolutions (
  id              uuid primary key default gen_random_uuid(),
  incident_id     uuid not null references incidents(id) on delete cascade,
  resolution_type text not null,
  observation     text,
  responsible     uuid references users(id),
  documentation   text,
  created_at      timestamptz not null default now()
);

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null,
  incident_id uuid references incidents(id) on delete cascade,
  title       text not null,
  body        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifs_user on notifications (user_id, read, created_at desc);

-- ============================================================================
-- 5. AUDITORÍA (inmutable desde el front — sección 30)
-- ============================================================================
create table if not exists audit_logs (
  audit_id     uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      uuid references users(id),
  user_nombre  text,
  rol          text,
  action       text not null,
  module       text not null,
  incident_id  uuid,
  record       text,
  old_value    jsonb,
  new_value    jsonb,
  ip           text,
  user_agent   text,
  metadata     jsonb
);
create index if not exists idx_audit_incident on audit_logs (incident_id, created_at desc);
create index if not exists idx_audit_user     on audit_logs (user_id, created_at desc);
create index if not exists idx_audit_action   on audit_logs (action, created_at desc);

-- ============================================================================
-- 6. CORRELATIVO DE NÚMERO DE INCIDENCIA  (INC-AAAA-NNNNNN)
-- ============================================================================
create table if not exists incident_counters (
  year        int primary key,
  last_number int not null default 0
);

create or replace function next_incident_number(p_year int default null)
returns text
language plpgsql
as $$
declare
  v_year int := coalesce(p_year, extract(year from now())::int);
  v_num  int;
begin
  insert into incident_counters (year, last_number)
  values (v_year, 1)
  on conflict (year) do update set last_number = incident_counters.last_number + 1
  returning last_number into v_num;
  return 'INC-' || v_year || '-' || lpad(v_num::text, 6, '0');
end;
$$;

-- ============================================================================
-- 7. updated_at automático
-- ============================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_incidents_updated on incidents;
create trigger trg_incidents_updated before update on incidents
  for each row execute function set_updated_at();

-- ============================================================================
-- 8. HELPERS DE PERMISOS
-- ============================================================================
create or replace function user_has_permission(p_user_id uuid, p_perm text)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from users u
    join role_permissions rp on rp.role_code = u.rol
    where u.id = p_user_id and u.activo and rp.permission_code = p_perm
  );
$$;

-- ============================================================================
-- 9. RPCs ATÓMICAS (sección 58) — validan permiso + escriben historial + auditoría
--    Todas SECURITY DEFINER: corren como owner y omiten RLS, pero validan
--    el permiso del actor explícitamente.
-- ============================================================================

-- Registra un evento de auditoría (uso interno de las RPCs)
create or replace function _audit(
  p_user uuid, p_action text, p_module text, p_incident uuid,
  p_record text, p_old jsonb, p_new jsonb, p_meta jsonb default null
) returns void language plpgsql as $$
declare v_nombre text; v_rol text;
begin
  select nombre, rol into v_nombre, v_rol from users where id = p_user;
  insert into audit_logs (user_id, user_nombre, rol, action, module, incident_id, record, old_value, new_value, metadata)
  values (p_user, v_nombre, v_rol, p_action, p_module, p_incident, p_record, p_old, p_new, p_meta);
end;
$$;

-- Crear incidencia (con ítems) — sección 8
create or replace function create_incident(p_actor uuid, p_payload jsonb)
returns incidents
language plpgsql security definer set search_path = public
as $$
declare
  v_inc incidents;
  v_num text;
  v_item jsonb;
  v_status text := coalesce(p_payload->>'status', 'PENDIENTE');
begin
  if not user_has_permission(p_actor, 'incident.create') then
    raise exception 'Sin permiso para crear incidencias' using errcode = '42501';
  end if;

  v_num := next_incident_number();

  insert into incidents (
    incident_number, document_number, invoice_number, supplier_id, warehouse_id,
    reason, status, priority, description, created_by, emission_date
  ) values (
    v_num,
    nullif(p_payload->>'document_number',''),
    nullif(p_payload->>'invoice_number',''),
    (p_payload->>'supplier_id')::uuid,
    (p_payload->>'warehouse_id')::uuid,
    p_payload->>'reason',
    v_status,
    coalesce(p_payload->>'priority','NORMAL'),
    nullif(p_payload->>'description',''),
    p_actor,
    coalesce((p_payload->>'emission_date')::timestamptz, now())
  ) returning * into v_inc;

  for v_item in select * from jsonb_array_elements(coalesce(p_payload->'items','[]'::jsonb))
  loop
    insert into incident_items (
      incident_id, product_id, codigo, descripcion,
      expected_qty, received_qty, affected_qty, difference_qty, unit, lot, observation
    ) values (
      v_inc.id,
      nullif(v_item->>'product_id','')::uuid,
      v_item->>'codigo',
      v_item->>'descripcion',
      coalesce((v_item->>'expected_qty')::numeric,0),
      coalesce((v_item->>'received_qty')::numeric,0),
      coalesce((v_item->>'affected_qty')::numeric,0),
      coalesce((v_item->>'difference_qty')::numeric,0),
      coalesce(v_item->>'unit','UN'),
      nullif(v_item->>'lot',''),
      nullif(v_item->>'observation','')
    );
  end loop;

  insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
  values (v_inc.id, null, v_status, p_actor, 'Incidencia creada');

  perform _audit(p_actor, 'CREATE', 'incidents', v_inc.id, v_num, null, to_jsonb(v_inc));
  return v_inc;
end;
$$;

-- Cambiar estado genérico (valida transición + historial + auditoría)
create or replace function incident_change_status(
  p_actor uuid, p_incident uuid, p_to text, p_comment text default null,
  p_perm text default 'incident.update'
) returns incidents
language plpgsql security definer set search_path = public
as $$
declare v_inc incidents; v_from text;
begin
  if not user_has_permission(p_actor, p_perm) then
    raise exception 'Sin permiso (%%) para esta acción', p_perm using errcode = '42501';
  end if;

  select * into v_inc from incidents where id = p_incident for update;
  if not found then raise exception 'Incidencia no encontrada'; end if;
  v_from := v_inc.status;

  update incidents set
    status = p_to,
    verified_at   = case when p_to = 'VERIFICADO'    then now() else verified_at end,
    resolved_at   = case when p_to = 'EN_RESOLUCION' and resolved_at is null then now() else resolved_at end,
    closed_at     = case when p_to = 'TERMINADO'     then now() else closed_at end
  where id = p_incident returning * into v_inc;

  insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
  values (p_incident, v_from, p_to, p_actor, p_comment);

  perform _audit(p_actor, 'STATUS_CHANGE', 'incidents', p_incident, v_inc.incident_number,
                 jsonb_build_object('status', v_from), jsonb_build_object('status', p_to),
                 jsonb_build_object('comment', p_comment));
  return v_inc;
end;
$$;

-- Wrappers de workflow con su permiso específico
create or replace function verify_incident(p_actor uuid, p_incident uuid, p_result text, p_comment text)
returns incidents language plpgsql security definer set search_path = public as $$
declare v_inc incidents;
begin
  v_inc := incident_change_status(p_actor, p_incident, 'VERIFICADO', p_comment, 'incident.verify');
  perform _audit(p_actor, 'VERIFY', 'incidents', p_incident, v_inc.incident_number, null,
                 jsonb_build_object('result', p_result, 'comment', p_comment));
  return v_inc;
end; $$;

create or replace function resolve_incident(p_actor uuid, p_incident uuid, p_type text, p_observation text)
returns incidents language plpgsql security definer set search_path = public as $$
declare v_inc incidents;
begin
  v_inc := incident_change_status(p_actor, p_incident, 'EN_RESOLUCION', p_observation, 'incident.resolve');
  insert into incident_resolutions (incident_id, resolution_type, observation, responsible)
  values (p_incident, p_type, p_observation, p_actor);
  return v_inc;
end; $$;

create or replace function close_incident(p_actor uuid, p_incident uuid, p_comment text)
returns incidents language plpgsql security definer set search_path = public as $$
begin
  return incident_change_status(p_actor, p_incident, 'TERMINADO', p_comment, 'incident.close');
end; $$;

create or replace function reopen_incident(p_actor uuid, p_incident uuid, p_comment text)
returns incidents language plpgsql security definer set search_path = public as $$
begin
  return incident_change_status(p_actor, p_incident, 'PENDIENTE', p_comment, 'incident.reopen');
end; $$;

-- Anular (soft delete — sección 32)
create or replace function anular_incident(p_actor uuid, p_incident uuid, p_reason text)
returns incidents language plpgsql security definer set search_path = public as $$
declare v_inc incidents; v_from text;
begin
  if not user_has_permission(p_actor, 'incident.delete') then
    raise exception 'Sin permiso para anular' using errcode = '42501';
  end if;
  select status into v_from from incidents where id = p_incident;
  update incidents set status='ANULADO', deleted_at=now(), deleted_by=p_actor, delete_reason=p_reason
  where id = p_incident returning * into v_inc;
  insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
  values (p_incident, v_from, 'ANULADO', p_actor, p_reason);
  perform _audit(p_actor, 'DELETE', 'incidents', p_incident, v_inc.incident_number, null,
                 jsonb_build_object('reason', p_reason));
  return v_inc;
end; $$;

-- Asignar
create or replace function assign_incident(p_actor uuid, p_incident uuid, p_assignee uuid)
returns incidents language plpgsql security definer set search_path = public as $$
declare v_inc incidents;
begin
  if not user_has_permission(p_actor, 'incident.assign') then
    raise exception 'Sin permiso para asignar' using errcode = '42501';
  end if;
  update incidents set assigned_to = p_assignee where id = p_incident returning * into v_inc;
  insert into incident_assignments (incident_id, assigned_by, assigned_to) values (p_incident, p_actor, p_assignee);
  perform _audit(p_actor, 'ASSIGN', 'incidents', p_incident, v_inc.incident_number, null,
                 jsonb_build_object('assigned_to', p_assignee));
  return v_inc;
end; $$;

-- Comentar
create or replace function add_comment(p_actor uuid, p_incident uuid, p_body text)
returns incident_comments language plpgsql security definer set search_path = public as $$
declare v_c incident_comments;
begin
  if not user_has_permission(p_actor, 'incident.comment') then
    raise exception 'Sin permiso para comentar' using errcode = '42501';
  end if;
  insert into incident_comments (incident_id, user_id, body) values (p_incident, p_actor, p_body)
  returning * into v_c;
  perform _audit(p_actor, 'COMMENT', 'incidents', p_incident, null, null, jsonb_build_object('body', p_body));
  return v_c;
end; $$;

-- ============================================================================
-- 10. RLS  — lectura para clientes; escritura SOLO vía RPC (SECURITY DEFINER)
--     No se crean policies de INSERT/UPDATE/DELETE => escritura directa negada.
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'incident_reasons','incident_statuses','roles','permissions','role_permissions',
    'users','suppliers','products','warehouses','incidents','incident_items',
    'incident_status_history','incident_comments','incident_evidences',
    'incident_assignments','incident_resolutions','notifications','audit_logs'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists p_read_%1$s on %1$I;', t);
    execute format('create policy p_read_%1$s on %1$I for select using (true);', t);
  end loop;
end $$;

-- ============================================================================
-- 11. SEED MÍNIMO (usuarios + catálogos de ejemplo) — ajustar a la realidad
-- ============================================================================
insert into warehouses (nombre, codigo) values
  ('Depósito Central','DEP-01'), ('Depósito Fábrica','DEP-02')
on conflict do nothing;

insert into users (nombre, rol) values
  ('Administrador', 'ADMIN'),
  ('Nelson Gonzalez', 'JEFE_LOGISTICA'),
  ('David Espínola', 'SUPERVISOR_RECEPCION'),
  ('José Villalba', 'OPERADOR_RECEPCION')
on conflict do nothing;

-- ============================================================================
--  FIN. Próximo: crear bucket de Storage "evidencias" (privado) para la Fase 8.
-- ============================================================================
