-- ============================================================================
--  SINCRONIZACIÓN DE USUARIOS DESDE EL SSO DEL LAUNCHER (SECURITY DEFINER)
--  Correr en Supabase → SQL Editor (después de schema.sql).
--
--  ¿Por qué existe?
--  Todas las RPC de este módulo validan permisos con user_has_permission(p_actor),
--  que busca `select ... from users where id = p_actor`. El p_actor es el UUID
--  del usuario que llega en el token SSO del Launcher. Si ese UUID no está en la
--  tabla `users` local, TODA escritura falla con "Sin permiso" (42501).
--
--  ensure_user() aprovisiona (upsert) al usuario autenticado por el Launcher en la
--  tabla local usando su MISMO id, para que el módulo "lea los usuarios" desde la
--  fuente de verdad (el Launcher/SSO) igual que el resto de los módulos ALAS.
--
--  Modelo de confianza: mientras el front use la anon key, el id/nombre/rol vienen
--  de un token YA verificado server-side por la Edge Function verify-sso-token;
--  el cliente solo reenvía esos datos. Mismo modelo que el resto del módulo.
-- ============================================================================

create or replace function ensure_user(
  p_id     uuid,
  p_nombre text,
  p_rol    text default 'OPERADOR_RECEPCION'
) returns users
language plpgsql security definer set search_path = public as $$
declare
  v_user users;
  v_rol  text;
begin
  if p_id is null then
    raise exception 'ensure_user: id nulo' using errcode = '22004';
  end if;

  -- Normaliza/valida el rol contra el catálogo; si no existe, cae a operador.
  select code into v_rol from roles where code = coalesce(p_rol, '');
  if v_rol is null then
    v_rol := 'OPERADOR_RECEPCION';
  end if;

  insert into users (id, auth_uid, nombre, rol, activo)
  values (p_id, p_id, coalesce(nullif(trim(p_nombre), ''), 'Usuario ALAS'), v_rol, true)
  on conflict (id) do update
    set nombre = excluded.nombre,
        rol    = excluded.rol,
        activo = true
  returning * into v_user;

  return v_user;
end; $$;

-- La anon key debe poder invocarla (mismo criterio que las demás RPC del módulo).
grant execute on function ensure_user(uuid, text, text) to anon, authenticated;
