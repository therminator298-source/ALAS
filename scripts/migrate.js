// Migra los datos de Google Sheets (Apps Script) al proyecto Supabase.
// Requisito: las tablas ya deben existir -> correr scripts/setup.sql en el SQL Editor.
//   node scripts/migrate.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Las credenciales se leen de los mismos archivos que usa el navegador para que
// la migracion nunca apunte a un proyecto distinto al de la app.
function loadBrowserConfig(file) {
  const win = {};
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  new Function('window', code)(win);
  return win;
}

const { SUPABASE_CONFIG } = loadBrowserConfig('supabase-config.js');
const { APP_CONFIG } = loadBrowserConfig('config.js');

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: { persistSession: false }
});

// El Apps Script espera ?resource=<nombre>&_key=<appKey> (no "endpoint").
async function fetchFromGAS(resource) {
  const url = `${APP_CONFIG.gasUrl}?resource=${encodeURIComponent(resource)}`
    + `&_key=${encodeURIComponent(APP_CONFIG.gasAppKey)}&_ts=${Date.now()}`;
  const res = await fetch(url);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${resource}: respuesta no-JSON (${text.slice(0, 80)})`);
  }
  if (data && data.status === 'error') throw new Error(data.message || `Error en ${resource}`);
  return Array.isArray(data) ? data : (data.data || []);
}

async function upsertBatched(table, rows, size = 50) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + size), { onConflict: 'id' });
    if (error) throw new Error(`${table} lote ${Math.floor(i / size) + 1}: ${error.message}`);
  }
}

async function migrate() {
  console.log(`Migrando Google Sheets -> ${SUPABASE_CONFIG.url}\n`);

  console.log('1. Usuarios...');
  const gasUsers = await fetchFromGAS('usuarios');
  const usuarios = gasUsers.map(u => ({
    id: u.id,
    nombre: u.nombre,
    rol: String(u.rol || 'operativo').toLowerCase(),
    dep: u.dep || 'fabrica',
    activo: u.activo !== false,
    pin_hash: u.pin_hash || u.pinHash || null
  })).filter(u => u.id && u.nombre);
  await upsertBatched('usuarios', usuarios);
  console.log(`   ${usuarios.length} usuarios migrados`);

  console.log('2. Tareas...');
  const gasTasks = await fetchFromGAS('tareas');
  const tareas = gasTasks.map(t => {
    const k = t.tarea || t;
    return {
      id: k.id,
      fecha: k.fecha || '',
      tipo: k.tipo || '',
      obs: k.obs || '',
      hi: k.hi || '',
      hf: k.hf || '',
      estado: k.estado || 'pendiente',
      asig: k.asig || '',
      dep: k.dep || 'fabrica',
      prio: !!k.prio,
      pOrder: k.pOrder != null && k.pOrder !== '' ? Number(k.pOrder) : null,
      fCrea: k.fCrea || '',
      fIni: k.fIni || '',
      fFin: k.fFin || '',
      creadoPor: k.creadoPor || '',
      retraso: k.retraso || '',
      delayCount: Number(k.delayCount) || 0,
      delayTotalMinutes: Number(k.delayTotalMinutes) || 0,
      delayActive: !!k.delayActive,
      delayCurrentId: k.delayCurrentId || '',
      delayCurrentStart: k.delayCurrentStart || ''
    };
  }).filter(t => t.id);
  await upsertBatched('tareas', tareas);
  console.log(`   ${tareas.length} tareas migradas`);

  console.log('3. Demoras...');
  const gasDelays = await fetchFromGAS('demoras');
  // Solo las demoras cuya tarea existe: "taskId" tiene FK contra tareas(id).
  const taskIds = new Set(tareas.map(t => t.id));
  const demoras = gasDelays.map(d => ({
    id: d.id,
    taskId: d.taskId,
    motivo: d.motivo || '',
    inicio: d.inicio || new Date().toISOString(),
    fin: d.fin || null,
    minutos: Number(d.minutos) || 0,
    abiertaPor: d.abiertaPor || '',
    cerradaPor: d.cerradaPor || '',
    estado: d.estado || 'cerrada'
  })).filter(d => d.id && taskIds.has(d.taskId));
  if (demoras.length) await upsertBatched('demoras', demoras);
  console.log(`   ${demoras.length} demoras migradas (de ${gasDelays.length} en la hoja)`);

  console.log('\nMigracion completada. Verifica en el Table Editor de Supabase.');
}

migrate().catch(e => {
  console.error('\nMigracion fallida:', e.message);
  if (/schema cache|does not exist/i.test(e.message)) {
    console.error('Falta el esquema: corre scripts/setup.sql en el SQL Editor del proyecto.');
  }
  process.exit(1);
});
