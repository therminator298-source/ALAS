/**
 * Corre los archivos de db/ contra un Postgres real (PGlite, en memoria) para
 * encontrar errores ANTES de pegarlos en el SQL Editor de Supabase.
 *
 * Este proyecto no tiene migraciones versionadas: cada cambio de esquema se
 * pega a mano en producción. Esto es la red de seguridad mínima — no valida
 * que la lógica sea la correcta, pero sí que el SQL corra sin explotar.
 *
 * Uso:
 *   node scripts/verify-sql.mjs                       # el pipeline de Acuses+Calendario
 *   node scripts/verify-sql.mjs db/otro_archivo.sql   # archivos sueltos
 *
 * Limitaciones: PGlite no es Supabase. No existen `auth.uid()`, Storage ni
 * las extensiones del panel. El script crea los roles `anon`/`authenticated`
 * y la publicación `supabase_realtime` para que los GRANT y el realtime
 * corran igual que allá.
 */
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Orden real de instalación en el proyecto fdcumrdbnrjpbfbrxqiw.
const PIPELINE = [
  'db/acuse_schema.sql',
  'db/acuse_guardado_atomico.sql',
  'db/calendario_00_archivar_tabla_vieja.sql',
  'db/calendario_setup_en_acuses.sql',
  'db/seguridad_01_permisos_minimos.sql',
];

const files = process.argv.slice(2).length ? process.argv.slice(2) : PIPELINE;

/** Lo que Supabase ya trae puesto y PGlite no. */
const PRELUDIO = `
  create role anon nologin;
  create role authenticated nologin;
  create publication supabase_realtime;
`;

const db = new PGlite();
await db.exec(PRELUDIO);

let fallos = 0;

for (const file of files) {
  let sql;
  try {
    sql = await readFile(file, 'utf8');
  } catch {
    console.log(` FALLA  ${file} — no existe`);
    fallos++;
    continue;
  }

  // Se corre el archivo COMPLETO, consultas de verificación incluidas: es
  // exactamente lo que se va a pegar en el SQL Editor.
  if (sql.charCodeAt(0) === 0xfeff) {
    fallos++;
    console.log(` FALLA  ${file}\n        empieza con BOM — Postgres da "syntax error at or near". Guardar como UTF-8 sin BOM.`);
    continue;
  }

  try {
    await db.exec(sql);
    console.log(`  OK    ${file}`);
  } catch (e) {
    fallos++;
    const msg = String(e.message || e).split('\n')[0];
    console.log(` FALLA  ${file}\n        ${msg}`);
    if (e.position) {
      const linea = sql.slice(0, Number(e.position)).split('\n').length;
      console.log(`        línea ~${linea}: ${sql.split('\n')[linea - 1]?.trim().slice(0, 90)}`);
    }
  }
}

if (fallos === 0) {
  console.log('\n─── permisos de `anon` después de todo el pipeline ───');
  const r = await db.query(`
    select table_name, string_agg(privilege_type, ', ' order by privilege_type) as permisos
      from information_schema.role_table_grants
     where table_schema = 'public' and grantee = 'anon'
     group by table_name order by table_name`);
  for (const row of r.rows) console.log(`  ${row.table_name.padEnd(18)} ${row.permisos}`);

  const peligro = r.rows.filter((x) => /DELETE|TRUNCATE/.test(x.permisos) && x.table_name !== 'tareas' && x.table_name !== 'acuse_detalle');
  console.log(peligro.length
    ? `\n⚠️  Tablas que todavía se pueden borrar: ${peligro.map((x) => x.table_name).join(', ')}`
    : '\n✓ Ninguna tabla borrable de más (solo tareas y acuse_detalle, que la app necesita).');
}

// ── Prueba funcional: un acuse se guarda completo o no se guarda nada ───────
if (fallos === 0) {
  console.log('\n─── prueba funcional de `guardar_acuse_atomico` ───');
  const t = async (nombre, fn) => {
    try { const d = await fn(); console.log(`  OK    ${nombre}${d ? ` — ${d}` : ''}`); }
    catch (e) { fallos++; console.log(` FALLA  ${nombre} — ${String(e.message || e).split('\n')[0]}`); }
  };

  await db.exec(`
    insert into clientes (cod_cliente, nombre, ruc, direccion, ciudad, zona, telefono)
    values ('CLI-TEST', 'Cliente de prueba', '80000000-0', 'Dirección de prueba', 'Luque', 'CENTRAL', '021000000');
    insert into articulos (material, descripcion, um)
    values ('MAT-TEST', 'Mercadería de prueba', 'UN');
    insert into repartidores (codigo, nombre, activo)
    values ('REP-TEST', 'Repartidor de prueba', true);`);
  const repartidorId = (await db.query(`select id from repartidores where codigo = 'REP-TEST'`)).rows[0].id;
  let acuseId;

  await t('crea cabecera, detalle, historial y log juntos', async () => {
    const details = JSON.stringify([{ cod_mercaderia: 'MAT-TEST', cantidad: 3, um: 'UN', nota: 'Sin golpes' }]);
    const result = await db.query(
      `select * from guardar_acuse_atomico($1::bigint, $2::text, $3::text, $4::date, $5::date, $6::bigint, $7::text, $8::text, $9::jsonb)`,
      [null, 'CLI-TEST', 'Pendiente', '2026-09-14', null, repartidorId, 'Prueba', 'tester', details],
    );
    acuseId = result.rows[0].id;
    const saved = (await db.query(`
      select a.cliente_nombre, a.zona, d.descripcion, d.cantidad::int cantidad,
             (select count(*)::int from acuse_historial h where h.acuse_id = a.id) historial,
             (select count(*)::int from acuse_log l where l.acuse_id = a.id) logs
        from acuses a join acuse_detalle d on d.acuse_id = a.id
       where a.id = $1`, [acuseId])).rows[0];
    if (saved.cliente_nombre !== 'Cliente de prueba' || saved.zona !== 'CENTRAL') throw new Error('snapshot de cliente incorrecto');
    if (saved.descripcion !== 'Mercadería de prueba' || saved.cantidad !== 3) throw new Error('detalle incorrecto');
    if (saved.historial !== 1 || saved.logs !== 1) throw new Error('auditoría incompleta');
    return result.rows[0].nro_acuse;
  });

  await t('revierte todo si una mercadería no existe', async () => {
    const before = (await db.query('select count(*)::int n from acuses')).rows[0].n;
    try {
      await db.query(
        `select * from guardar_acuse_atomico($1::bigint, $2::text, $3::text, $4::date, $5::date, $6::bigint, $7::text, $8::text, $9::jsonb)`,
        [null, 'CLI-TEST', 'Pendiente', '2026-09-14', null, repartidorId, null, 'tester', JSON.stringify([{ cod_mercaderia: 'NO-EXISTE', cantidad: 1 }])],
      );
    } catch {
      const after = (await db.query('select count(*)::int n from acuses')).rows[0].n;
      if (after !== before) throw new Error('quedó una cabecera huérfana');
      return 'sin cabecera huérfana';
    }
    throw new Error('aceptó una mercadería inexistente');
  });

  await t('actualiza el detalle dentro de la misma transacción', async () => {
    const details = JSON.stringify([{ cod_mercaderia: 'MAT-TEST', cantidad: 7, um: 'UN', nota: null }]);
    await db.query(
      `select * from guardar_acuse_atomico($1::bigint, $2::text, $3::text, $4::date, $5::date, $6::bigint, $7::text, $8::text, $9::jsonb)`,
      [acuseId, 'CLI-TEST', 'En Reparto', '2026-09-14', null, repartidorId, null, 'tester', details],
    );
    const saved = (await db.query(`select count(*)::int n, max(cantidad)::int cantidad from acuse_detalle where acuse_id = $1`, [acuseId])).rows[0];
    if (saved.n !== 1 || saved.cantidad !== 7) throw new Error('el detalle no fue reemplazado correctamente');
    return 'cantidad 7';
  });
}

// ── Prueba funcional: que la tabla y la RPC hagan lo que dicen ──────────────
if (fallos === 0) {
  console.log('\n─── prueba funcional de `tareas` ───');
  const t = async (nombre, fn) => {
    try { const d = await fn(); console.log(`  OK    ${nombre}${d ? ` — ${d}` : ''}`); }
    catch (e) { fallos++; console.log(` FALLA  ${nombre} — ${String(e.message || e).split('\n')[0]}`); }
  };

  await t('se puede insertar una tarea', async () => {
    await db.exec(`
      insert into tareas (titulo, fecha, hora, responsable, deposito, prioridad, estado, usuario, orden) values
        ('DESCARGA',   '2026-09-13', '08:00', 'José',  'Depósito Central', 'ALTA',   'Pendiente', 'test', 0),
        ('REPOSICIÓN', '2026-09-13', '09:00', 'David', 'Depósito Central', 'NORMAL', 'Pendiente', 'test', 1),
        ('ARREGLO',    '2026-09-13', '10:00', 'Nelson','Depósito Central', 'BAJA',   'Pendiente', 'test', 2),
        ('OTRA FECHA', '2026-09-20', '08:00', 'José',  'Depósito Central', 'NORMAL', 'Pendiente', 'test', 0);`);
    const r = await db.query('select count(*)::int as n from tareas');
    return `${r.rows[0].n} filas`;
  });

  await t('updated_at se actualiza solo', async () => {
    const antes = (await db.query(`select updated_at from tareas where titulo='DESCARGA'`)).rows[0].updated_at;
    await db.exec(`update tareas set estado='Hecho' where titulo='DESCARGA'`);
    const desp = (await db.query(`select updated_at from tareas where titulo='DESCARGA'`)).rows[0].updated_at;
    if (!(new Date(desp) > new Date(antes))) throw new Error('no cambió');
    return 'sí';
  });

  await t('reorder_tareas reordena en una sola llamada', async () => {
    // Mandar ARREGLO (id 3) al principio del 13/09.
    await db.query('select reorder_tareas($1::bigint[], $2::int[])', [[3, 1, 2], [0, 1, 2]]);
    const r = await db.query(`select titulo from tareas where fecha='2026-09-13' order by orden`);
    const orden = r.rows.map((x) => x.titulo).join(' < ');
    if (!orden.startsWith('ARREGLO')) throw new Error(`quedó: ${orden}`);
    return orden;
  });

  await t('reorder_tareas rechaza arrays de distinto largo', async () => {
    try {
      await db.query('select reorder_tareas($1::bigint[], $2::int[])', [[1, 2], [0]]);
    } catch { return 'lanza excepción, como debe'; }
    throw new Error('aceptó parámetros inválidos');
  });

  await t('el orden no se mezcla entre días distintos', async () => {
    const r = await db.query(`
      select fecha::text, count(*)::int - count(distinct orden)::int as duplicados
        from tareas group by fecha, deposito having count(*) - count(distinct orden) > 0`);
    if (r.rows.length) throw new Error(`hay orden duplicado en ${r.rows.length} día(s)`);
    return 'cada día numera desde 0 sin choques';
  });
}

// ── Escenario real: la tabla `tareas` del sistema anterior ──────────────────
//  Réplica del esquema que había en producción (importado desde Firebase el
//  15/07/2026): id hexadecimal, fecha con hora, tipo/obs/hi/hf, asig, dep,
//  prio boolean, pOrder y todo el seguimiento de retrasos.
if (fallos === 0) {
  console.log('\n─── sobre la tabla `tareas` del sistema anterior ───');
  const db2 = new PGlite();
  await db2.exec(PRELUDIO);
  await db2.exec(await readFile('db/acuse_schema.sql', 'utf8'));
  await db2.exec(`
    create table tareas (
      id text primary key, fecha timestamptz,
      tipo text, obs text, hi text, hf text, estado text, asig text, dep text,
      prio boolean, "pOrder" int,
      "fCrea" timestamptz, "fIni" timestamptz, "fFin" timestamptz,
      "creadoPor" text, retraso text,
      "delayCount" int, "delayTotalMinutes" int, "delayActive" boolean,
      "delayCurrentId" text, "delayCurrentStart" timestamptz,
      created_at timestamptz default now(), deposito text);
    create index idx_tareas_fecha  on tareas (fecha);
    create index idx_tareas_estado on tareas (estado);
    alter table tareas enable row level security;
    create policy anon_all on tareas for all to anon using (true) with check (true);
    grant all on tareas to anon, authenticated;
    insert into tareas (id, fecha, tipo, obs, hi, hf, estado, asig, dep, prio, "pOrder", "creadoPor") values
      ('1bb4b6ac2d234fd4','2026-04-27T03:00:00Z','descarga','Hormigoneras ANSA','12:00','13:50','terminado','usr_37a6cdf2','deposito',true,1,'Nelson Gonzalez'),
      ('17f49b94d20f492e','2026-05-18T03:00:00Z','ruteo_int','7 RUTEOS INTERIOR<br>55214 KILOS','07:52',null,'en_proceso','usr_767852f7','fabrica',false,1,'Cristhian Delgado'),
      ('fa6e6d6a5cee420c','2026-05-18T03:00:00Z','chatarra','CARGAR CHATARRA','07:53',null,'pendiente','usr_76d2752b','fabrica',false,null,'Cristhian Delgado');`);

  const paso = async (f) => { await db2.exec(await readFile(f, 'utf8')); };
  try {
    await paso('db/calendario_00_archivar_tabla_vieja.sql');
    await paso('db/calendario_setup_en_acuses.sql');
    await paso('db/seguridad_01_permisos_minimos.sql');

    const hist = (await db2.query('select count(*)::int n from tareas_historico')).rows[0].n;
    if (hist !== 3) throw new Error(`se perdieron datos del histórico: ${hist} de 3 filas`);

    // El histórico conserva sus columnas originales tal cual.
    const viejo = (await db2.query(
      `select tipo, "creadoPor" from tareas_historico where id = '1bb4b6ac2d234fd4'`)).rows[0];
    if (viejo.tipo !== 'descarga' || viejo.creadoPor !== 'Nelson Gonzalez') {
      throw new Error('el histórico quedó alterado');
    }

    // Y no queda expuesto con la anon key.
    const exp = (await db2.query(
      `select count(*)::int n from information_schema.role_table_grants
        where table_name = 'tareas_historico' and grantee = 'anon'`)).rows[0].n;
    if (exp !== 0) throw new Error('tareas_historico sigue accesible con la anon key');

    // La tabla nueva funciona, con id numérico y fecha sin hora.
    await db2.exec(`insert into tareas (titulo, fecha, hora, deposito, prioridad, estado, usuario)
                    values ('DESCARGA', '2026-09-13', '08:00', 'Depósito Central', 'ALTA', 'Pendiente', 'test')`);
    const nueva = (await db2.query('select id, titulo, fecha::text from tareas')).rows[0];
    if (typeof nueva.id !== 'number' || nueva.fecha !== '2026-09-13') {
      throw new Error(`la tabla nueva quedó mal: ${JSON.stringify(nueva)}`);
    }

    await paso('db/calendario_00_archivar_tabla_vieja.sql'); // idempotencia

    console.log(`  OK    archiva sin perder datos — ${hist} filas en tareas_historico`);
    console.log('  OK    el histórico no queda expuesto con la anon key');
    console.log('  OK    la tabla nueva queda limpia — id numérico, fecha sin hora');
    console.log('  OK    se puede correr dos veces seguidas');
  } catch (e) {
    fallos++;
    console.log(` FALLA  ${String(e.message || e).split('\n')[0]}`);
  }
}

// ── Escenario: el proyecto aloja VARIOS módulos ─────────────────────────────
//  Este Supabase no tiene solo Acuses y Calendario: también las 19 tablas de
//  Incidencias y tres de la app de calendario anterior. La primera versión de
//  seguridad_01 hacía `revoke all on all tables in schema public` y dejó a
//  Incidencias con sus policies pero sin GRANT — sin poder leer nada.
if (fallos === 0) {
  console.log('\n─── con Incidencias en el mismo proyecto ───');
  const db3 = new PGlite();
  await db3.exec(PRELUDIO);
  await db3.exec(await readFile('db/acuse_schema.sql', 'utf8'));
  await db3.exec(`
    create table incidents  (id bigint generated by default as identity primary key, numero text);
    create table products   (id bigint generated by default as identity primary key, codigo text);
    create table users      (id uuid primary key default gen_random_uuid(), nombre text);
    create table audit_logs (id bigint generated by default as identity primary key, accion text);
    create table demoras    (id text primary key, minutos int);
    insert into incidents (numero) values ('INC-0001');
    do $$ declare t text; begin
      foreach t in array array['incidents','products','users','audit_logs'] loop
        execute format('alter table %I enable row level security', t);
        execute format('create policy p_read_%1$s on %1$I for select using (true)', t);
      end loop;
      alter table demoras enable row level security;
      create policy anon_all on demoras for all to anon using (true) with check (true);
    end $$;
    grant all on all tables in schema public to anon, authenticated;`);

  /** Tablas con policy pero sin ningún GRANT: PostgREST les da permission denied. */
  const rotas = async () => (await db3.query(`
    select c.relname from pg_class c
      join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
     where c.relkind = 'r'
       and exists (select 1 from pg_policies p where p.tablename = c.relname and p.schemaname = 'public')
       and not exists (select 1 from information_schema.role_table_grants g
                        where g.table_name = c.relname and g.table_schema = 'public' and g.grantee = 'anon')
     order by 1`)).rows.map((r) => r.relname);

  try {
    await db3.exec(await readFile('db/calendario_setup_en_acuses.sql', 'utf8'));
    await db3.exec(await readFile('db/seguridad_01_permisos_minimos.sql', 'utf8'));

    const sueltas = await rotas();
    if (sueltas.length) {
      throw new Error(`seguridad_01 dejó sin GRANT a: ${sueltas.join(', ')}`);
    }
    await db3.query('select count(*) from incidents');
    console.log('  OK    seguridad_01 no toca las tablas de otros módulos');

    // Y el reparador arregla una base que ya quedó en ese estado.
    await db3.exec('revoke all on all tables in schema public from anon, authenticated');
    const antes = (await rotas()).length;
    await db3.exec(await readFile('db/seguridad_02_restaurar_grants.sql', 'utf8'));
    const despues = await rotas();
    if (despues.length) throw new Error(`seguridad_02 no reparó: ${despues.join(', ')}`);

    const inc = (await db3.query(
      `select privilege_type from information_schema.role_table_grants
        where table_name = 'incidents' and grantee = 'anon'`)).rows.map((r) => r.privilege_type);
    if (inc.join() !== 'SELECT') throw new Error(`incidents quedó con ${inc.join(', ')}, se esperaba solo SELECT`);

    console.log(`  OK    seguridad_02 repara ${antes} tablas rotas, devolviendo solo lo que la policy permite`);
  } catch (e) {
    fallos++;
    console.log(` FALLA  ${String(e.message || e).split('\n')[0]}`);
  }
}

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} problema(s) — no pegar en Supabase todavía`}`);
if (fallos) process.exitCode = 1;
