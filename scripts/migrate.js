const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yyuniovoywemybfzhwou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dW5pb3ZveXdlbXliZnpod291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTA1NjQsImV4cCI6MjA5NDY4NjU2NH0.PTfmdPGhBARgWKzzkSGwkSFQaid2Er_StEoKQNu4w38';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyPCyvgwe_2UKo-zQORmUTermBj0ofJQtzC6oiucXdSLus4PkFoeaQR84kOUDxdYwNY/exec';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

async function fetchFromGAS(endpoint) {
  const url = `${GAS_URL}?endpoint=${endpoint}&_ts=${Date.now()}`;
  const res = await fetch(url);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (data && data.status === 'error') throw new Error(data.message || `Error en ${endpoint}`);
  return Array.isArray(data) ? data : data.data || [];
}

async function migrate() {
  console.log('Iniciando migracion de Google Sheets a Supabase...\n');

  // 1. Migrar usuarios
  console.log('1. Cargando usuarios desde Google Sheets...');
  let gasUsers;
  try {
    gasUsers = await fetchFromGAS('usuarios');
  } catch (e) {
    console.log('   Fallo endpoint usuarios, probando con carga completa...');
    const all = await fetchFromGAS('tareas');
    console.log(`   Obtenidos ${Array.isArray(all) ? all.length : 0} registros (tareas, no usuarios)`);
    gasUsers = [];
  }
  console.log(`   Usuarios obtenidos: ${gasUsers.length}`);

  if (gasUsers.length > 0) {
    const usersForSupabase = gasUsers.map(u => ({
      id: u.id || u[0],
      nombre: u.nombre || u.nm || u[1],
      rol: (u.rol || u[3] || 'operativo').toLowerCase(),
      dep: u.dep || u[4] || 'fabrica',
      activo: u.activo !== false && u[5] !== false
    })).filter(u => u.id && u.nombre);

    const { data, error } = await supabase.from('usuarios').upsert(usersForSupabase, { onConflict: 'id' });
    if (error) {
      console.error('   Error insertando usuarios:', error.message);
    } else {
      console.log(`   Usuarios migrados: ${usersForSupabase.length}`);
    }
  }

  // 2. Crear admin por defecto (si no existe)
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode('1234'));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const defaultPinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: existingAdmin } = await supabase.from('usuarios').select('id').eq('id', 'admin_default').single();
  if (!existingAdmin) {
    await supabase.from('usuarios').upsert({
      id: 'admin_default',
      nombre: 'Administrador',
      rol: 'admin',
      dep: 'admin',
      activo: true,
      pin_hash: defaultPinHash
    }, { onConflict: 'id' });
    console.log('   Admin por defecto creado (PIN: 1234)');
  }

  // 3. Migrar tareas
  console.log('\n2. Cargando tareas desde Google Sheets...');
  let gasTasks;
  try {
    gasTasks = await fetchFromGAS('tareas');
  } catch (e) {
    console.log('   Error cargando tareas:', e.message);
    gasTasks = [];
  }
  console.log(`   Tareas obtenidas: ${gasTasks.length}`);

  if (gasTasks.length > 0) {
    const tasksForSupabase = gasTasks.map(t => {
      const task = t.tarea || t;
      return {
        id: task.id || task[0],
        fecha: task.fecha || task[1] || '',
        tipo: task.tipo || task[2] || '',
        obs: task.obs || task[3] || '',
        hi: task.hi || task[4] || '',
        hf: task.hf || task[5] || '',
        estado: task.estado || task[6] || 'pendiente',
        asig: task.asig || task[7] || '',
        dep: task.dep || task[8] || 'fabrica',
        prio: !!(task.prio || task[9]),
        pOrder: task.pOrder != null ? Number(task.pOrder) : null,
        fCrea: task.fCrea || task[10] || '',
        fIni: task.fIni || task[11] || '',
        fFin: task.fFin || task[12] || '',
        creadoPor: task.creadoPor || task[13] || '',
        retraso: task.retraso || task[14] || '',
        delayCount: Number(task.delayCount || task[15]) || 0,
        delayTotalMinutes: Number(task.delayTotalMinutes || task[16]) || 0,
        delayActive: !!(task.delayActive || task[17]),
        delayCurrentId: task.delayCurrentId || task[18] || '',
        delayCurrentStart: task.delayCurrentStart || task[19] || ''
      };
    }).filter(t => t.id);

    const BATCH_SIZE = 50;
    for (let i = 0; i < tasksForSupabase.length; i += BATCH_SIZE) {
      const batch = tasksForSupabase.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('tareas').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`   Error lote ${i / BATCH_SIZE + 1}: ${error.message}`);
      }
    }
    console.log(`   Tareas migradas: ${tasksForSupabase.length}`);
  }

  console.log('\nMigracion completada.');
  console.log('Verifica en Supabase Table Editor que los datos esten cargados.');
}

migrate().catch(e => {
  console.error('Migracion fallida:', e);
  process.exit(1);
});
