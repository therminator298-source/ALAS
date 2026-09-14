#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const DEFAULT_CLIENTES = resolve(process.cwd(), '..', 'CLIENNTE ALAS DATOS.xlsx');
const DEFAULT_MERCADERIAS = resolve(process.cwd(), '..', 'LISTADO DE MERCADERIAS (5).xlsm');
const BATCH_SIZE = 500;

function option(name, fallback) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function clean(value) {
  const text = String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  return text || null;
}

function readSheet(file, expectedHeaders) {
  const workbook = XLSX.readFile(file, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(`${file}: el libro no contiene hojas.`);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: false });
  const headers = new Set(Object.keys(rows[0] || {}));
  const missing = expectedHeaders.filter((header) => !headers.has(header));
  if (missing.length) throw new Error(`${file}: faltan columnas: ${missing.join(', ')}.`);
  return rows;
}

function uniqueRows(rows, key, label) {
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (!row[key]) throw new Error(`${label}: código vacío en la fila ${index + 2}.`);
    if (seen.has(row[key])) throw new Error(`${label}: código duplicado ${row[key]}.`);
    seen.add(row[key]);
  }
  return rows;
}

function parseCatalogs(clientesFile, mercaderiasFile) {
  const clientes = uniqueRows(
    readSheet(clientesFile, [
      'Cod_Cliente', 'Nom_Cliente', 'Ruc_Cliente', 'Ciudad_Cliente',
      'Telef_Cliente', 'Direc_Cliente', 'Depart_Cliente',
    ]).map((row) => ({
      cod_cliente: clean(row.Cod_Cliente),
      nombre: clean(row.Nom_Cliente),
      ruc: clean(row.Ruc_Cliente),
      direccion: clean(row.Direc_Cliente),
      ciudad: clean(row.Ciudad_Cliente),
      zona: clean(row.Depart_Cliente),
      telefono: clean(row.Telef_Cliente),
    })),
    'cod_cliente',
    'Clientes',
  );

  const articulos = uniqueRows(
    readSheet(mercaderiasFile, ['Material', 'Denominación', 'UM']).map((row) => ({
      material: clean(row.Material),
      descripcion: clean(row['Denominación']),
      um: clean(row.UM),
    })),
    'material',
    'Mercaderías',
  );

  const clientesSinNombre = clientes.filter((row) => !row.nombre).length;
  const articulosSinDescripcion = articulos.filter((row) => !row.descripcion).length;
  if (clientesSinNombre || articulosSinDescripcion) {
    throw new Error(`Datos incompletos: ${clientesSinNombre} clientes sin nombre y ${articulosSinDescripcion} mercaderías sin descripción.`);
  }

  return { clientes, articulos };
}

async function loadLocalEnvironment() {
  for (const filename of ['.env.import.local', '.env.local']) {
    try {
      const source = await readFile(resolve(process.cwd(), filename), 'utf8');
      for (const line of source.split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match || process.env[match[1]]) continue;
        process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

async function countRows(client, table) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`${table}: no se pudo leer el conteo (${error.message}).`);
  return count ?? 0;
}

async function upsertBatches(client, table, rows, conflict) {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);
    const { error } = await client.from(table).upsert(batch, { onConflict: conflict });
    if (error) throw new Error(`${table}, filas ${start + 1}-${start + batch.length}: ${error.message}`);
    const completed = Math.min(start + batch.length, rows.length);
    process.stdout.write(`\r  ${table}: ${completed}/${rows.length}`);
  }
  process.stdout.write('\n');
}

const clientesFile = resolve(option('--clientes', DEFAULT_CLIENTES));
const mercaderiasFile = resolve(option('--mercaderias', DEFAULT_MERCADERIAS));
const apply = process.argv.includes('--apply');

try {
  const { clientes, articulos } = parseCatalogs(clientesFile, mercaderiasFile);
  console.log('Catálogos validados correctamente:');
  console.log(`  Clientes:     ${clientes.length.toLocaleString('es-PY')}`);
  console.log(`  Mercaderías:  ${articulos.length.toLocaleString('es-PY')}`);
  console.log('  Campos de mercadería: código, descripción y UM.');

  if (!apply) {
    console.log('\nModo validación: no se modificó Supabase. Usá --apply para importar.');
    process.exit(0);
  }

  await loadLocalEnvironment();
  const url = process.env.ACUSE_SUPABASE_URL || process.env.VITE_ACUSE_SUPABASE_URL;
  const secretKey = process.env.ACUSE_SUPABASE_SECRET_KEY || process.env.ACUSE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new Error('Para importar se requieren ACUSE_SUPABASE_URL y ACUSE_SUPABASE_SECRET_KEY (o la clave legacy ACUSE_SUPABASE_SERVICE_ROLE_KEY). Nunca uses una variable VITE_* para una clave secreta.');
  }

  const client = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const before = {
    clientes: await countRows(client, 'clientes'),
    articulos: await countRows(client, 'articulos'),
  };

  console.log('\nImportando por lotes idempotentes...');
  await upsertBatches(client, 'clientes', clientes, 'cod_cliente');
  await upsertBatches(client, 'articulos', articulos, 'material');

  const after = {
    clientes: await countRows(client, 'clientes'),
    articulos: await countRows(client, 'articulos'),
  };
  console.log(`Importación finalizada. Clientes ${before.clientes} → ${after.clientes}; mercaderías ${before.articulos} → ${after.articulos}.`);
} catch (error) {
  console.error(`ERROR: ${error?.message || error}`);
  process.exitCode = 1;
}
