-- ============================================================================
--  ALAS · SEGURIDAD paso 2 — restaurar los GRANT que el paso 1 borró de más
--  Proyecto: fdcumrdbnrjpbfbrxqiw
--  CORRER CUANTO ANTES si ya corriste seguridad_01_permisos_minimos.sql.
--
--  QUÉ PASÓ
--  --------
--  seguridad_01 empieza con:
--      revoke all on all tables in schema public from anon, authenticated;
--  y después reparte permisos tabla por tabla. Estaba escrito asumiendo que
--  el proyecto tenía SOLO las tablas de Acuses y Calendario.
--
--  Pero este proyecto tiene además las 19 tablas del módulo de Incidencias
--  (incidents, products, users, audit_logs, suppliers, roles…) y tres de la
--  app anterior de calendario (demoras, sesiones, usuarios). A todas esas el
--  revoke les sacó el GRANT y nadie se los devolvió.
--
--  En Postgres hacen falta las DOS cosas: el GRANT y la policy de RLS. Con
--  policy pero sin GRANT, PostgREST responde «permission denied for table».
--
--  QUÉ HACE ESTE ARCHIVO
--  ---------------------
--  Le devuelve a cada tabla exactamente los permisos que sus policies ya
--  permiten — ni uno más. Si una tabla solo tiene policy de SELECT, recibe
--  solo SELECT. O sea: restaura lo que funcionaba sin reabrir nada.
--
--  Es idempotente y no toca las tablas que seguridad_01 configuró bien.
-- ============================================================================

begin;

do $$
declare
  r record;
  privs text;
begin
  for r in
    select
      p.tablename,
      -- Las policies FOR ALL habilitan las cuatro operaciones.
      string_agg(distinct
        case p.cmd
          when 'ALL'    then 'select, insert, update, delete'
          when 'SELECT' then 'select'
          when 'INSERT' then 'insert'
          when 'UPDATE' then 'update'
          when 'DELETE' then 'delete'
        end, ', ') as privilegios
    from pg_policies p
    join pg_class c on c.relname = p.tablename
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    where p.schemaname = 'public'
      and c.relkind = 'r'
      -- Solo las que quedaron sin ningún GRANT para anon.
      and not exists (
        select 1 from information_schema.role_table_grants g
         where g.table_schema = 'public'
           and g.table_name = p.tablename
           and g.grantee = 'anon'
      )
    group by p.tablename
  loop
    privs := r.privilegios;
    execute format('grant %s on %I to anon, authenticated', privs, r.tablename);
    raise notice 'restaurado: % → %', r.tablename, privs;
  end loop;
end $$;

-- Las secuencias hacen falta para las columnas `identity`.
grant usage, select on all sequences in schema public to anon, authenticated;

commit;

-- ============================================================================
--  VERIFICACIÓN — no debería quedar ninguna tabla con policy pero sin GRANT
-- ============================================================================
select
  c.relname as tabla,
  string_agg(distinct p.cmd, ', ' order by p.cmd) as policies,
  coalesce(string_agg(distinct g.privilege_type, ', ' order by g.privilege_type), '⚠️ SIN GRANT') as grants
from pg_class c
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
left join pg_policies p on p.tablename = c.relname and p.schemaname = 'public'
left join information_schema.role_table_grants g
       on g.table_name = c.relname and g.table_schema = 'public' and g.grantee = 'anon'
where c.relkind = 'r'
group by c.relname
order by (coalesce(string_agg(distinct g.privilege_type, ','), '') = ''
          and string_agg(distinct p.cmd, ',') is not null) desc,
         c.relname;

-- Las primeras filas son las que tienen problema. Si ninguna dice
-- "⚠️ SIN GRANT" teniendo policies, quedó todo bien.
--
-- `tareas_historico` e `incident_counters` SÍ deben aparecer sin policies y
-- sin grants: son inaccesibles a propósito.

-- ============================================================================
--  PARA REVISAR DESPUÉS (no urgente)
--
--  `demoras`, `sesiones` y `usuarios` tienen policies FOR ALL — abiertas de
--  par en par. Son de la app de calendario anterior, la misma que dejó la
--  tabla que archivamos como `tareas_historico`. Si ya nadie las usa,
--  conviene archivarlas igual en vez de dejarlas escribibles con la anon key:
--
--    alter table demoras  rename to demoras_historico;
--    alter table sesiones rename to sesiones_historico;
--    alter table usuarios rename to usuarios_historico;
--    revoke all on demoras_historico, sesiones_historico, usuarios_historico
--      from anon, authenticated;
--
--  Confirmar antes que nada las esté usando.
-- ============================================================================
