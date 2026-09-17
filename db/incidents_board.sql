-- ============================================================================
--  ALAS · Incidencias de Recepción — vista del tablero
--
--  Ejecutar una vez en el SQL Editor de Supabase, después de db/schema.sql.
--  Es idempotente: se puede volver a correr sin romper nada.
--
--  QUÉ RESUELVE
--  ------------
--  El tablero muestra tarjetas con foto, proveedor, unidades afectadas y
--  cantidad de evidencias. Ninguno de esos cuatro datos se puede leer de la
--  tabla `incidents`:
--
--    · proveedor      → vive en `suppliers`
--    · unidades       → hay que SUMAR incident_items.affected_qty
--    · cantidad fotos → hay que CONTAR incident_evidences
--    · la miniatura   → es la primera evidencia de tipo imagen
--
--  Hasta ahora el front mostraba esos valores porque estaban escritos a mano
--  en el mock (src/lib/mockData.ts). Con datos reales salían vacíos: la tabla
--  los renderiza con `?? '—'`, así que la ausencia pasaba desapercibida.
--
--  Resolverlo desde el cliente significaría una consulta por tarjeta —o traer
--  todos los items y todas las evidencias de todas las incidencias para sumar
--  en JavaScript—. Acá se calcula una sola vez, del lado del servidor, donde
--  además hay índices.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Índices de apoyo.
--
--  Los dos LATERAL de abajo se ejecutan una vez por incidencia listada. Sin
--  índice por incident_id, cada uno recorre la tabla entera: con 500
--  incidencias y 25 en pantalla son 50 escaneos completos por carga.
--
--  El de incident_items no existía (schema.sql sólo indexa incident y
--  product por separado); el de evidences sí, y por eso lleva IF NOT EXISTS.
-- ---------------------------------------------------------------------------
create index if not exists idx_items_incident_qty
  on incident_items (incident_id) include (affected_qty);

create index if not exists idx_evidences_incident_created
  on incident_evidences (incident_id, created_at);


-- ---------------------------------------------------------------------------
--  La vista.
--
--  security_invoker = true NO es opcional. Una vista de Postgres corre por
--  defecto con los permisos de quien la creó, no de quien la consulta: sin
--  esta opción se saltearía el RLS de incidents, suppliers y users, y el
--  tablero terminaría siendo una puerta trasera a filas que las políticas
--  no dejan leer directamente.
--
--  Hoy las políticas de schema.sql son `for select using (true)` —lectura
--  abierta— así que no cambia nada en la práctica. Importa el día que se
--  cierren, que es justo el día en que nadie se va a acordar de esta vista.
--  Requiere Postgres 15 o superior; Supabase ya está arriba de eso.
-- ---------------------------------------------------------------------------
drop view if exists incidents_board;

create view incidents_board
with (security_invoker = true)
as
select
  i.id,
  i.incident_number,
  i.document_number,
  i.invoice_number,
  i.supplier_id,
  i.warehouse_id,
  i.reason,
  i.status,
  i.priority,
  i.description,
  i.created_by,
  i.assigned_to,
  i.emission_date,
  i.created_at,
  i.updated_at,
  i.verified_at,
  i.resolved_at,
  i.closed_at,
  i.deleted_at,

  s.nombre  as supplier_nombre,
  ua.nombre as created_by_nombre,
  ub.nombre as assigned_to_nombre,

  -- Los agregados. coalesce porque una incidencia recién creada todavía no
  -- tiene items ni evidencias, y el front distingue "cero" de "no vino el
  -- dato": con null volveríamos al guión que hoy tapa el problema.
  coalesce(it.items_count, 0)     as items_count,
  coalesce(it.affected_units, 0)  as affected_units,
  coalesce(ev.evidences_count, 0) as evidences_count,

  -- La miniatura de la tarjeta: la PRIMERA foto, no la última. La primera es
  -- la que sacó quien recibió la mercadería, en el momento; las que se suman
  -- después suelen ser del reclamo o del remito. Para reconocer la incidencia
  -- de un vistazo sirve la del hecho.
  ev.first_photo_url

from incidents i
left join suppliers s on s.id = i.supplier_id
left join users    ua on ua.id = i.created_by
left join users    ub on ub.id = i.assigned_to

left join lateral (
  select count(*)::int                   as items_count,
         coalesce(sum(ii.affected_qty),0) as affected_units
    from incident_items ii
   where ii.incident_id = i.id
) it on true

left join lateral (
  select count(*)::int as evidences_count,
         (select e2.file_url
            from incident_evidences e2
           where e2.incident_id = i.id
             -- Sólo imágenes: una evidencia puede ser un PDF del remito, y
             -- un PDF como <img src> en la tarjeta es un recuadro roto.
             and e2.file_type like 'image/%'
           order by e2.created_at asc
           limit 1) as first_photo_url
    from incident_evidences e
   where e.incident_id = i.id
) ev on true

-- Las borradas no entran nunca. Que el filtro viva acá y no en cada consulta
-- es lo que evita que una pantalla nueva se olvide de ponerlo.
where i.deleted_at is null;


comment on view incidents_board is
  'Incidencias con proveedor, unidades afectadas, cantidad de evidencias y miniatura, para el tablero. Excluye borradas.';

-- El rol anon sólo lee. La escritura sigue pasando por las RPC de schema.sql,
-- que son las que validan permiso, registran historial y auditan.
grant select on incidents_board to anon, authenticated;


-- ---------------------------------------------------------------------------
--  Comprobación. Devuelve una fila por incidencia con todo lo que la tarjeta
--  necesita; si alguna columna viene en null que no debería, se ve acá.
-- ---------------------------------------------------------------------------
select incident_number,
       supplier_nombre,
       reason,
       status,
       affected_units,
       evidences_count,
       (first_photo_url is not null) as tiene_foto,
       created_at
  from incidents_board
 order by created_at desc
 limit 20;
