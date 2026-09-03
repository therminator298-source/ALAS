// Genera db/products.csv y db/migrate.sql a partir de "DATOS SISTEMA.xlsx".
// Uso: node scripts/generate-migration.mjs  (ajustá SRC si movés el Excel).
// Requiere el paquete xlsx. Fuente original: ~/Downloads/DATOS SISTEMA.xlsx
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const wb = XLSX.readFile('C:/Users/AGOMEZ/Downloads/DATOS SISTEMA.xlsx');
const J = (n) => XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '', blankrows: false });
const datos = J('DATOS');
const det = J('DETALLES');
const merc = J('MERCADERIAS');

const q = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`;
const s = (v) => String(v ?? '').trim();
const serialToISO = (n) => {
  if (typeof n !== 'number' || !isFinite(n)) return null;
  return new Date(Math.round((n - 25569) * 86400 * 1000)).toISOString();
};

// ── Mapeos ──
const REASON = (m) => {
  const v = s(m).toUpperCase();
  return ['SOBRANTE', 'FALTANTE', 'AVERIADO'].includes(v) ? v : 'OTRO';
};
const STATUS = (e) => {
  const v = s(e).toUpperCase();
  if (v === 'PROCESADO') return 'TERMINADO';
  if (v === 'VERIFICADO') return 'VERIFICADO';
  return 'PENDIENTE';
};
const USER = (c) => {
  const v = s(c);
  if (/david/i.test(v)) return 'David Espínola';
  if (/villalba/i.test(v)) return 'José Villalba';
  if (/adrian/i.test(v)) return 'Adrian Gomez';
  return 'David Espínola';
};

// ── 1) CSV de productos (dedup por código) ──
const seen = new Set();
const prodRows = [['codigo', 'descripcion', 'um']];
for (const r of merc) {
  const codigo = s(r['Cod Mercadería']);
  if (!codigo || seen.has(codigo)) continue;
  seen.add(codigo);
  prodRows.push([codigo, s(r['Descripción']), s(r['UM']) || 'UN']);
}
const csv = prodRows
  .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
  .join('\r\n');
writeFileSync('db/products.csv', '\uFEFF' + csv, 'utf8');

// ── 2) SQL de migración ──
const suppliers = [...new Set(datos.map((r) => s(r['Nombre Cliente'])).filter(Boolean))];

// Correlativo por año en orden de fecha
const withDate = datos
  .map((r) => ({ r, iso: serialToISO(r['Fecha Emisión']) }))
  .sort((a, b) => String(a.iso).localeCompare(String(b.iso)));
const seqByYear = {};
const idToNumber = {};
const maxByYear = {};
for (const { r, iso } of withDate) {
  const year = iso ? new Date(iso).getUTCFullYear() : 2025;
  seqByYear[year] = (seqByYear[year] || 0) + 1;
  const num = `INC-${year}-${String(seqByYear[year]).padStart(6, '0')}`;
  idToNumber[r['ID']] = { num, iso, year };
  maxByYear[year] = seqByYear[year];
}

let sql = `-- ============================================================================
--  MIGRACIÓN DE DATOS HISTÓRICOS (desde DATOS SISTEMA.xlsx)
--  Prerrequisito: importar db/products.csv en la tabla 'products' (Table Editor)
--  ANTES de correr esto, para que los ítems resuelvan product_id.
--  Idempotente (se puede correr más de una vez sin duplicar).
-- ============================================================================

-- 1) PROVEEDORES (desde Nombre Cliente)
insert into suppliers (nombre)
select v.nombre from (values
${suppliers.map((n) => `  (${q(n)})`).join(',\n')}
) v(nombre)
where not exists (select 1 from suppliers x where x.nombre = v.nombre);

-- 2) USUARIO faltante
insert into users (nombre, rol)
select 'Adrian Gomez','SUPERVISOR_RECEPCION'
where not exists (select 1 from users where nombre = 'Adrian Gomez');

-- 3) INCIDENCIAS
`;

for (const row of datos) {
  const id = row['ID'];
  const map = idToNumber[id];
  if (!map) continue;
  const reason = REASON(row['Motivo Traslado']);
  const status = STATUS(row['Estado']);
  const user = USER(row['Creado Por']);
  const supplier = s(row['Nombre Cliente']);
  const doc = s(row['Nro Acuse']);
  const invoice = s(row['Entrega el repartidor']);
  const iso = map.iso || '2025-01-01T00:00:00.000Z';
  const verifiedAt = status === 'VERIFICADO' || status === 'TERMINADO' ? `${q(iso)}` : 'null';
  const closedAt = status === 'TERMINADO' ? `${q(iso)}` : 'null';
  sql += `insert into incidents (incident_number, document_number, invoice_number, supplier_id, reason, status, priority, created_by, emission_date, created_at, updated_at, verified_at, closed_at)
select ${q(map.num)}, ${doc ? q(doc) : 'null'}, ${invoice ? q(invoice) : 'null'},
  ${supplier ? `(select id from suppliers where nombre = ${q(supplier)} limit 1)` : 'null'},
  ${q(reason)}, ${q(status)}, 'NORMAL',
  (select id from users where nombre = ${q(user)} limit 1),
  ${q(iso)}, ${q(iso)}, ${q(iso)}, ${verifiedAt}, ${closedAt}
on conflict (incident_number) do nothing;
`;
}

sql += `\n-- 4) ÍTEMS (linkean por DATOS.ID → incident_number)\n`;
for (const d of det) {
  const map = idToNumber[d['Nro Acuse']];
  if (!map) continue;
  const codigo = s(d['Cod Mercadería']);
  const desc = s(d['Descripcion Mercadería']);
  const um = s(d['UM']) || 'UN';
  const cant = Number(d['Cantidad']) || 0;
  const nota = s(d['Nota']);
  sql += `insert into incident_items (incident_id, product_id, codigo, descripcion, expected_qty, received_qty, affected_qty, difference_qty, unit, observation)
select i.id, (select id from products where codigo = ${q(codigo)} limit 1), ${q(codigo)}, ${q(desc)}, 0, 0, ${cant}, ${cant}, ${q(um)}, ${nota ? q(nota) : 'null'}
from incidents i where i.incident_number = ${q(map.num)}
and not exists (select 1 from incident_items ii where ii.incident_id = i.id and ii.codigo = ${q(codigo)} and ii.affected_qty = ${cant});
`;
}

sql += `\n-- 5) HISTORIAL de creación (por incidencia migrada)\n`;
for (const row of datos) {
  const map = idToNumber[row['ID']];
  if (!map) continue;
  sql += `insert into incident_status_history (incident_id, from_status, to_status, user_id, comment)
select i.id, null, i.status, i.created_by, 'Migración de datos históricos'
from incidents i where i.incident_number = ${q(map.num)}
and not exists (select 1 from incident_status_history h where h.incident_id = i.id);
`;
}

sql += `\n-- 6) Correlativos (para que nuevas incidencias continúen)\n`;
for (const [year, mx] of Object.entries(maxByYear)) {
  sql += `insert into incident_counters (year, last_number) values (${year}, ${mx})
on conflict (year) do update set last_number = greatest(incident_counters.last_number, excluded.last_number);\n`;
}

writeFileSync('db/migrate.sql', sql, 'utf8');

console.log('OK');
console.log('products.csv:', prodRows.length - 1, 'productos');
console.log('migrate.sql:', suppliers.length, 'proveedores,', datos.length, 'incidencias,', det.length, 'ítems');
console.log('correlativos por año:', maxByYear);
