-- ============================================================================
-- ALAS · Acuses: repartidor opcional y altas manuales de catálogos
--
-- Ejecutar una vez en Supabase SQL Editor antes de publicar el cliente.
-- Mantiene clientes y artículos sin INSERT directo para anon/authenticated:
-- las altas pasan por RPC con validaciones y permisos mínimos.
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
  if p_detalles is null or jsonb_typeof(p_detalles) <> 'array' or jsonb_array_length(p_detalles) = 0 then
    raise exception 'El acuse debe incluir al menos una mercadería.' using errcode = '22023';
  end if;

  select * into v_cliente
    from clientes
   where cod_cliente = btrim(p_cod_cliente);
  if not found then
    raise exception 'El cliente % no existe en el catálogo.', p_cod_cliente using errcode = '23503';
  end if;

  if p_repartidor_id is not null then
    select r.* into v_repartidor
      from repartidores r
     where r.id = p_repartidor_id and r.activo = true;
    if not found then
      raise exception 'El repartidor seleccionado no existe o está inactivo.' using errcode = '23503';
    end if;
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
  is 'Crea o actualiza un acuse completo de forma transaccional, con repartidor opcional.';

create or replace function crear_cliente_acuse(
  p_cod_cliente text,
  p_nombre      text,
  p_ruc         text,
  p_direccion   text,
  p_ciudad      text,
  p_zona        text,
  p_telefono    text
)
returns table (
  cod_cliente text,
  nombre      text,
  ruc         text,
  direccion   text,
  ciudad      text,
  zona        text,
  telefono    text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text := upper(nullif(btrim(p_cod_cliente), ''));
begin
  if v_codigo is null then
    raise exception 'El código del cliente es obligatorio.' using errcode = '22023';
  end if;
  if nullif(btrim(p_nombre), '') is null then
    raise exception 'El nombre del cliente es obligatorio.' using errcode = '22023';
  end if;
  if exists (select 1 from clientes c where lower(c.cod_cliente) = lower(v_codigo)) then
    raise exception 'Ya existe un cliente con el código %.', v_codigo using errcode = '23505';
  end if;

  insert into clientes (cod_cliente, nombre, ruc, direccion, ciudad, zona, telefono)
  values (
    v_codigo,
    btrim(p_nombre),
    nullif(btrim(p_ruc), ''),
    nullif(btrim(p_direccion), ''),
    nullif(btrim(p_ciudad), ''),
    nullif(btrim(p_zona), ''),
    nullif(btrim(p_telefono), '')
  );

  return query
  select c.cod_cliente, c.nombre, c.ruc, c.direccion, c.ciudad, c.zona, c.telefono
    from clientes c
   where c.cod_cliente = v_codigo;
end;
$$;

revoke all on function crear_cliente_acuse(text, text, text, text, text, text, text) from public;
grant execute on function crear_cliente_acuse(text, text, text, text, text, text, text) to anon, authenticated;

comment on function crear_cliente_acuse(text, text, text, text, text, text, text)
  is 'Registra manualmente un cliente desde Acuses sin habilitar INSERT directo al catálogo.';

create or replace function crear_articulo_acuse(
  p_material    text,
  p_descripcion text,
  p_um           text
)
returns table (
  material    text,
  descripcion text,
  um          text,
  status      text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_material text := upper(nullif(btrim(p_material), ''));
begin
  if v_material is null then
    raise exception 'El código de la mercadería es obligatorio.' using errcode = '22023';
  end if;
  if nullif(btrim(p_descripcion), '') is null then
    raise exception 'La descripción de la mercadería es obligatoria.' using errcode = '22023';
  end if;
  if exists (select 1 from articulos a where lower(a.material) = lower(v_material)) then
    raise exception 'Ya existe una mercadería con el código %.', v_material using errcode = '23505';
  end if;

  insert into articulos (material, descripcion, um, status)
  values (
    v_material,
    btrim(p_descripcion),
    coalesce(nullif(upper(btrim(p_um)), ''), 'UN'),
    'Activo'
  );

  return query
  select a.material, a.descripcion, a.um, a.status
    from articulos a
   where a.material = v_material;
end;
$$;

revoke all on function crear_articulo_acuse(text, text, text) from public;
grant execute on function crear_articulo_acuse(text, text, text) to anon, authenticated;

comment on function crear_articulo_acuse(text, text, text)
  is 'Registra manualmente una mercadería desde Acuses sin habilitar INSERT directo al catálogo.';
