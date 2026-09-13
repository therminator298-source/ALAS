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

  // Las consultas de verificación al final de cada archivo usan vistas del
  // catálogo que PGlite no expone igual; se corta ahí.
  const cuerpo = sql.split(/^-- =+\r?\n--\s+VERIFICACI/m)[0];

  try {
    await db.exec(cuerpo);
    console.log(`  OK    ${file}`);
  } catch (e) {
    fallos++;
    const msg = String(e.message || e).split('\n')[0];
    console.log(` FALLA  ${file}\n        ${msg}`);
    if (e.position) {
      const hasta = cuerpo.slice(0, Number(e.position));
      const linea = hasta.split('\n').length;
      console.log(`        línea ~${linea}: ${cuerpo.split('\n')[linea - 1]?.trim().slice(0, 90)}`);
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

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} problema(s) — no pegar en Supabase todavía`}`);
if (fallos) process.exitCode = 1;
