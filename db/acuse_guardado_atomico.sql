-- ============================================================================
-- ALAS · Acuses: guardado transaccional de cabecera, detalle e historial
--
-- Ejecutar una vez en Supabase SQL Editor antes de publicar el cliente que usa
-- esta RPC. Toda la función corre en una única transacción de PostgreSQL: si
-- falla una mercadería, no queda un acuse incompleto.
-- ============================================================================

create or replace function guardar_acuse_atomico(
  p_acuse_id       bigint,
  p_cod_cliente    text,
  p_estado         text,
  p_fecha_emision  date,
  p_fecha_entrega  date,
  p_repartidor_id  bigint,
  p_observacion    text,
  p_usuario        text,
  p_detalles       jsonb
)
returns table (id bigint, nro_acuse text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente         clientes%rowtype;
  v_repartidor      repartidores%rowtype;
  v_articulo        articulos%rowtype;
  v_acuse           acuses%rowtype;
  v_detalle         jsonb;
  v_codigo          text;
  v_cantidad        numeric;
  v_estado          text;
  v_estado_anterior text;
begin
  if nullif(btrim(p_cod_cliente), '') is null then
    raise exception 'El cliente es obligatorio.' using errcode = '22023';
  end if;
  if p_fecha_emision is null then
    raise exception 'La fecha de emisión es obligatoria.' using errcode = '22023';
  end if;
  if p_repartidor_id is null then
    raise exception 'El repartidor es obligatorio.' using errcode = '22023';
  end if;
  if p_detalles is null or jsonb_typeof(p_detalles) <> 'array' or jsonb_array_length(p_detalles) = 0 then
    raise exception 'El acuse debe incluir al menos una mercadería.' using errcode = '22023';
  end if;

  select * into v_cliente
    from clientes
   where cod_cliente = btrim(p_cod_cliente);
  if not found then
    raise exception 'El cliente % no existe en el catálogo.', p_cod_cliente using errcode = '23503';
  end if;

  select r.* into v_repartidor
    from repartidores r
   where r.id = p_repartidor_id and r.activo = true;
  if not found then
    raise exception 'El repartidor seleccionado no existe o está inactivo.' using errcode = '23503';
  end if;

  v_estado := case lower(btrim(coalesce(p_estado, '')))
    when 'entregado'    then 'Entregado'
    when 'en reparto'   then 'En Reparto'
    when 'en transito'  then 'En Reparto'
    when 'en tránsito'  then 'En Reparto'
    when 'anulado'      then 'Anulado'
    else 'Pendiente'
  end;

  if p_acuse_id is null then
    insert into acuses (
      cod_cliente, cliente_nombre, cliente_ruc, cliente_direccion,
      cliente_ciudad, cliente_telefono, zona, estado, fecha_emision,
      fecha_entrega, repartidor_id, repartidor_nombre, observacion, usuario, activo
    ) values (
      v_cliente.cod_cliente, v_cliente.nombre, v_cliente.ruc, v_cliente.direccion,
      v_cliente.ciudad, v_cliente.telefono, v_cliente.zona, v_estado, p_fecha_emision,
      p_fecha_entrega, v_repartidor.id, v_repartidor.nombre,
      nullif(btrim(p_observacion), ''), nullif(btrim(p_usuario), ''), true
    )
    returning * into v_acuse;
  else
    select * into v_acuse
      from acuses
     where acuses.id = p_acuse_id and activo = true
     for update;
    if not found then
      raise exception 'El acuse % no existe o está anulado.', p_acuse_id using errcode = 'P0002';
    end if;
    if v_acuse.estado = 'Entregado' then
      raise exception 'Un acuse entregado no puede editarse.' using errcode = '22023';
    end if;

    v_estado_anterior := v_acuse.estado;
    update acuses set
      cod_cliente       = v_cliente.cod_cliente,
      cliente_nombre    = v_cliente.nombre,
      cliente_ruc       = v_cliente.ruc,
      cliente_direccion = v_cliente.direccion,
      cliente_ciudad    = v_cliente.ciudad,
      cliente_telefono  = v_cliente.telefono,
      zona              = v_cliente.zona,
      estado            = v_estado,
      fecha_emision     = p_fecha_emision,
      fecha_entrega     = p_fecha_entrega,
      repartidor_id     = v_repartidor.id,
      repartidor_nombre = v_repartidor.nombre,
      observacion       = nullif(btrim(p_observacion), '')
    where acuses.id = p_acuse_id
    returning * into v_acuse;

    delete from acuse_detalle where acuse_id = v_acuse.id;
  end if;

  for v_detalle in select value from jsonb_array_elements(p_detalles)
  loop
    v_codigo := nullif(btrim(v_detalle ->> 'cod_mercaderia'), '');
    if v_codigo is null then
      raise exception 'Hay una mercadería sin código.' using errcode = '22023';
    end if;

    select * into v_articulo
      from articulos
     where material = v_codigo;
    if not found then
      raise exception 'La mercadería % no existe en el catálogo.', v_codigo using errcode = '23503';
    end if;

    begin
      v_cantidad := nullif(btrim(v_detalle ->> 'cantidad'), '')::numeric;
    exception when invalid_text_representation then
      raise exception 'La cantidad de la mercadería % no es válida.', v_codigo using errcode = '22023';
    end;
    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'La cantidad de la mercadería % debe ser mayor que cero.', v_codigo using errcode = '22023';
    end if;

    insert into acuse_detalle (acuse_id, cod_mercaderia, descripcion, cantidad, um, nota)
    values (
      v_acuse.id,
      v_articulo.material,
      v_articulo.descripcion,
      v_cantidad,
      coalesce(nullif(btrim(v_detalle ->> 'um'), ''), v_articulo.um),
      nullif(btrim(v_detalle ->> 'nota'), '')
    );
  end loop;

  if p_acuse_id is null then
    insert into acuse_historial (acuse_id, estado, usuario, observacion)
    values (v_acuse.id, v_estado, nullif(btrim(p_usuario), ''), 'Creación del acuse');
    insert into acuse_log (acuse_id, accion, usuario, observacion)
    values (v_acuse.id, 'CREAR', nullif(btrim(p_usuario), ''), 'Acuse creado desde módulo web');
  else
    if v_estado_anterior is distinct from v_estado then
      insert into acuse_historial (acuse_id, estado, usuario, observacion)
      values (v_acuse.id, v_estado, nullif(btrim(p_usuario), ''), 'Cambio de estado desde edición');
    end if;
    insert into acuse_log (acuse_id, accion, usuario, observacion)
    values (v_acuse.id, 'EDITAR', nullif(btrim(p_usuario), ''), 'Acuse actualizado desde módulo web');
  end if;

  return query select v_acuse.id, v_acuse.nro_acuse;
end;
$$;

revoke all on function guardar_acuse_atomico(bigint, text, text, date, date, bigint, text, text, jsonb) from public;
grant execute on function guardar_acuse_atomico(bigint, text, text, date, date, bigint, text, text, jsonb) to anon, authenticated;

comment on function guardar_acuse_atomico(bigint, text, text, date, date, bigint, text, text, jsonb)
  is 'Crea o actualiza un acuse completo de forma transaccional y toma los datos maestros desde los catálogos.';
