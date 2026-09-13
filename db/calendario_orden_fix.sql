-- ============================================================================
--  ALAS · CALENDARIO — arreglo del orden manual + reordenar atómico
--  Correr en el SQL Editor del proyecto Supabase del Calendario,
--  después de db/calendario_schema.sql.
--
--  PROBLEMA QUE ARREGLA
--  --------------------
--  `orden` se asignaba 0..n sobre la lista *filtrada* que el usuario tenía a la
--  vista. Reordenar las tareas del día 5 escribía orden 0,1,2 — los mismos
--  valores que ya tenían las del día 12. Como la consulta ordenaba por `orden`
--  ANTES que por `fecha`, las tareas de días distintos se entremezclaban y el
--  mes entero quedaba desordenado.
--
--  Ahora el orden es SIEMPRE relativo a (deposito, fecha), y la consulta ordena
--  por fecha primero. `reorder_tareas` escribe todo en una sola transacción en
--  lugar de un PATCH por fila.
-- ============================================================================

-- ── 1. Índice acorde al orden real de lectura ───────────────────────────────
drop index if exists idx_tareas_orden;
create index if not exists idx_tareas_dep_fecha_orden
  on tareas (deposito, fecha, orden nulls last, hora nulls first, id);

-- ── 2. Renumerar lo que ya está cargado, por (deposito, fecha) ──────────────
--  Toma el orden actual como preferencia y lo compacta a 0..n dentro de cada
--  día/depósito. Idempotente: se puede correr las veces que haga falta.
with numerado as (
  select id,
         row_number() over (
           partition by deposito, fecha
           order by orden nulls last, hora nulls first, id
         ) - 1 as nuevo_orden
  from tareas
)
update tareas t
   set orden = n.nuevo_orden
  from numerado n
 where t.id = n.id
   and t.orden is distinct from n.nuevo_orden;

-- ── 3. Reordenar atómico (una sola llamada desde el front) ──────────────────
create or replace function reorder_tareas(p_ids bigint[], p_ordenes int[])
returns void
language plpgsql
as $$
begin
  if p_ids is null or p_ordenes is null then
    raise exception 'reorder_tareas: parámetros nulos' using errcode = '22004';
  end if;
  if array_length(p_ids, 1) is distinct from array_length(p_ordenes, 1) then
    raise exception 'reorder_tareas: los arrays deben tener el mismo largo' using errcode = '22023';
  end if;

  update tareas t
     set orden = v.orden
    from (
      select unnest(p_ids) as id, unnest(p_ordenes) as orden
    ) v
   where t.id = v.id;
end;
$$;

grant execute on function reorder_tareas(bigint[], int[]) to anon, authenticated;

-- ── 4. Realtime (por si el schema original no llegó a publicarla) ───────────
do $$
begin
  begin alter publication supabase_realtime add table tareas;
  exception when duplicate_object then null; when undefined_object then null; end;
end $$;

-- ============================================================================
--  VERIFICACIÓN — no debería devolver ninguna fila:
--
--    select deposito, fecha, count(*) filter (where orden is null) as sin_orden,
--           count(*) - count(distinct orden) as duplicados
--      from tareas group by deposito, fecha
--     having count(*) - count(distinct orden) > 0;
-- ============================================================================
