-- ============================================================================
--  ALAS · CALENDARIO — archivar la tabla `tareas` del sistema anterior
--  Proyecto: fdcumrdbnrjpbfbrxqiw
--  Correr ANTES de calendario_setup_en_acuses.sql
--
--  QUÉ ENCONTRAMOS
--  ---------------
--  `tareas` ya existía con el esquema de una app de calendario anterior
--  (aparentemente importada desde Firebase el 15/07/2026):
--
--    id text hexadecimal · fecha timestamptz · tipo · obs · hi/hf · asig
--    dep · prio boolean · pOrder · fCrea/fIni/fFin · creadoPor
--    retraso · delayCount · delayTotalMinutes · delayActive · delayCurrent*
--
--  Nada de eso encaja con lo que espera la app de React, y el sistema que la
--  usaba ya no está en uso (últimos registros de mayo/2026).
--
--  QUÉ HACE ESTE ARCHIVO
--  ---------------------
--  Renombra `tareas` → `tareas_historico`. NO borra ni una fila: los datos
--  quedan enteros y consultables desde el panel de Supabase. Después,
--  calendario_setup_en_acuses.sql crea la tabla nueva y limpia.
--
--  Es idempotente: si ya se archivó, no hace nada.
-- ============================================================================

begin;

do $$
declare
  idx record;
  filas bigint;
begin
  -- Nada que archivar.
  if to_regclass('public.tareas') is null then
    raise notice 'No existe `tareas`: nada que archivar.';
    return;
  end if;

  -- Si ya tiene `titulo`, es la tabla NUEVA: no tocarla.
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'tareas'
                and column_name = 'titulo') then
    raise notice '`tareas` ya es la tabla nueva: no se archiva nada.';
    return;
  end if;

  if to_regclass('public.tareas_historico') is not null then
    raise exception 'Ya existe `tareas_historico`. Revisá qué hay en cada una antes de seguir.';
  end if;

  execute 'select count(*) from tareas' into filas;
  raise notice 'Archivando la tabla anterior con % fila(s) → tareas_historico', filas;

  alter table tareas rename to tareas_historico;

  -- Los nombres de índice son únicos POR ESQUEMA, no por tabla: si quedan
  -- como `tareas_pkey` o `idx_tareas_*`, la tabla nueva no se puede crear.
  for idx in
    select indexname from pg_indexes
     where schemaname = 'public' and tablename = 'tareas_historico'
       and indexname not like 'hist_%'
  loop
    execute format('alter index %I rename to %I', idx.indexname, 'hist_' || idx.indexname);
  end loop;
end $$;

-- ── Cerrar el histórico ─────────────────────────────────────────────────────
--  La app no lo usa. Sin policies y sin GRANT, `anon` no lo ve: son datos
--  operativos viejos que no tienen por qué estar expuestos con una clave
--  pública. Se consulta desde el panel de Supabase.
do $$
begin
  if to_regclass('public.tareas_historico') is null then return; end if;

  execute 'alter table tareas_historico enable row level security';
  execute 'revoke all on tareas_historico from anon, authenticated';

  -- Fuera cualquier policy que venga del esquema anterior.
  execute (
    select coalesce(string_agg(format('drop policy if exists %I on tareas_historico;', policyname), ' '), '')
      from pg_policies where schemaname = 'public' and tablename = 'tareas_historico'
  );
end $$;

commit;

-- ============================================================================
--  VERIFICACIÓN
-- ============================================================================

--  Ojo: `tareas_historico` puede no existir (si no había nada que archivar),
--  así que el conteo va por SQL dinámico. Un `select ... from tareas_historico`
--  directo fallaría al planificar la consulta, aunque nunca llegara a correr.
do $$
declare filas bigint;
begin
  if to_regclass('public.tareas_historico') is null then
    raise notice 'No hay tabla archivada (no existía una `tareas` anterior).';
  else
    execute 'select count(*) from tareas_historico' into filas;
    raise notice 'tareas_historico conserva % fila(s).', filas;
  end if;
end $$;

select
  case when to_regclass('public.tareas_historico') is null
       then 'sin histórico'
       else 'histórico archivado' end                                as historico,
  case when to_regclass('public.tareas') is null
       then 'libre — seguir con calendario_setup_en_acuses.sql'
       else 'ya existe una tabla `tareas`' end                       as tabla_nueva;

-- ============================================================================
--  SI TE ARREPENTÍS (mientras no hayas creado la tabla nueva):
--
--    alter table tareas_historico rename to tareas;
--    -- y renombrar los índices sacándoles el prefijo hist_
-- ============================================================================
