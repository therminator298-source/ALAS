const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'recepcion.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS importaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proveedor_id INTEGER NOT NULL,
      fecha_importacion TEXT DEFAULT (datetime('now','localtime')),
      archivo_nombre TEXT,
      doc_compras TEXT,
      observaciones TEXT,
      estado TEXT DEFAULT 'abierto',
      fecha_descarga TEXT,
      fecha_control_final TEXT,
      controlado_por TEXT,
      bultos_pl INTEGER DEFAULT 0,
      bultos_recibidos INTEGER DEFAULT 0,
      tipo_contenedor TEXT,
      tiene_codigo_barra INTEGER DEFAULT 0,
      estibador TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      importacion_id INTEGER NOT NULL,
      codigo TEXT,
      descripcion TEXT,
      cantidad_esperada INTEGER DEFAULT 0,
      cantidad_caja INTEGER DEFAULT 1,
      cantidad_controlada INTEGER DEFAULT 0,
      bultos INTEGER DEFAULT 0,
      unm TEXT DEFAULT 'UN',
      codigo_barra TEXT,
      observaciones TEXT,
      estado TEXT DEFAULT 'pendiente',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (importacion_id) REFERENCES importaciones(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS controles_parciales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      bultos INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS calidad_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      importacion_id INTEGER NOT NULL UNIQUE,
      cajas_buen_estado TEXT,
      codigos_correctos TEXT,
      cajas_enumeradas TEXT,
      items_separados TEXT,
      embalaje_correcto TEXT,
      tiene_codigos_barra TEXT,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (importacion_id) REFERENCES importaciones(id) ON DELETE CASCADE
    );
  `);

  // Migrar columnas nuevas si la DB ya existía
  var cols = db.prepare("PRAGMA table_info(importaciones)").all().map(c => c.name);
  if (!cols.includes('fecha_descarga')) {
    db.exec(`
      ALTER TABLE importaciones ADD COLUMN fecha_descarga TEXT;
      ALTER TABLE importaciones ADD COLUMN fecha_control_final TEXT;
      ALTER TABLE importaciones ADD COLUMN controlado_por TEXT;
      ALTER TABLE importaciones ADD COLUMN bultos_pl INTEGER DEFAULT 0;
      ALTER TABLE importaciones ADD COLUMN bultos_recibidos INTEGER DEFAULT 0;
      ALTER TABLE importaciones ADD COLUMN tipo_contenedor TEXT;
      ALTER TABLE importaciones ADD COLUMN tiene_codigo_barra INTEGER DEFAULT 0;
      ALTER TABLE importaciones ADD COLUMN estibador TEXT;
    `);
  }
  var itemCols = db.prepare("PRAGMA table_info(items)").all().map(c => c.name);
  if (!itemCols.includes('unm')) {
    db.exec(`
      ALTER TABLE items ADD COLUMN unm TEXT DEFAULT 'UN';
      ALTER TABLE items ADD COLUMN codigo_barra TEXT;
      ALTER TABLE items ADD COLUMN observaciones TEXT;
    `);
  }
}

init();

function getProveedores() {
  return db.prepare('SELECT * FROM proveedores ORDER BY nombre').all();
}

function getOrCreateProveedor(nombre) {
  nombre = nombre.trim().toUpperCase();
  var p = db.prepare('SELECT * FROM proveedores WHERE nombre = ?').get(nombre);
  if (!p) {
    var r = db.prepare('INSERT INTO proveedores (nombre) VALUES (?)').run(nombre);
    p = { id: r.lastInsertRowid, nombre };
  }
  return p;
}

function crearImportacion(data) {
  var r = db.prepare(`
    INSERT INTO importaciones (proveedor_id, archivo_nombre, doc_compras, observaciones,
      fecha_descarga, fecha_control_final, controlado_por, bultos_pl, bultos_recibidos,
      tipo_contenedor, tiene_codigo_barra, estibador)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.proveedor_id, data.archivo_nombre || null, data.doc_compras || null, data.observaciones || null,
    data.fecha_descarga || null, data.fecha_control_final || null, data.controlado_por || null,
    data.bultos_pl || 0, data.bultos_recibidos || 0,
    data.tipo_contenedor || null, data.tiene_codigo_barra || 0, data.estibador || null
  );
  return r.lastInsertRowid;
}

function actualizarImportacion(id, data) {
  db.prepare(`
    UPDATE importaciones SET
      doc_compras = COALESCE(?, doc_compras),
      observaciones = COALESCE(?, observaciones),
      fecha_descarga = COALESCE(?, fecha_descarga),
      fecha_control_final = COALESCE(?, fecha_control_final),
      controlado_por = COALESCE(?, controlado_por),
      bultos_pl = COALESCE(?, bultos_pl),
      bultos_recibidos = COALESCE(?, bultos_recibidos),
      tipo_contenedor = COALESCE(?, tipo_contenedor),
      tiene_codigo_barra = COALESCE(?, tiene_codigo_barra),
      estibador = COALESCE(?, estibador)
    WHERE id = ?
  `).run(
    data.doc_compras, data.observaciones,
    data.fecha_descarga, data.fecha_control_final, data.controlado_por,
    data.bultos_pl, data.bultos_recibidos,
    data.tipo_contenedor, data.tiene_codigo_barra, data.estibador,
    id
  );
}

function agregarItem(data) {
  var r = db.prepare(`
    INSERT INTO items (importacion_id, codigo, descripcion, cantidad_esperada, cantidad_caja, unm, codigo_barra, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')
  `).run(data.importacion_id, data.codigo || null, data.descripcion || null,
    data.cantidad_esperada || 0, data.cantidad_caja || 1,
    data.unm || 'UN', data.codigo_barra || null);
  return r.lastInsertRowid;
}

function actualizarItem(id, data) {
  db.prepare(`
    UPDATE items SET
      unm = COALESCE(?, unm),
      codigo_barra = COALESCE(?, codigo_barra),
      observaciones = COALESCE(?, observaciones)
    WHERE id = ?
  `).run(data.unm, data.codigo_barra, data.observaciones, id);
}

function getImportaciones() {
  return db.prepare(`
    SELECT i.*, p.nombre AS proveedor_nombre
    FROM importaciones i
    JOIN proveedores p ON p.id = i.proveedor_id
    ORDER BY i.fecha_importacion DESC
  `).all();
}

function getImportacion(id) {
  return db.prepare(`
    SELECT i.*, p.nombre AS proveedor_nombre
    FROM importaciones i
    JOIN proveedores p ON p.id = i.proveedor_id
    WHERE i.id = ?
  `).get(id);
}

function getItemsByImportacion(importacion_id) {
  return db.prepare(
    'SELECT * FROM items WHERE importacion_id = ? ORDER BY id'
  ).all(importacion_id);
}

function getItem(id) {
  return db.prepare('SELECT * FROM items WHERE id = ?').get(id);
}

function controlarItem({ item_id, cantidad, bultos }) {
  var txn = db.transaction(() => {
    db.prepare(
      'INSERT INTO controles_parciales (item_id, cantidad, bultos) VALUES (?, ?, ?)'
    ).run(item_id, cantidad, bultos || 0);
    var total = db.prepare(
      'SELECT COALESCE(SUM(cantidad),0) AS total FROM controles_parciales WHERE item_id = ?'
    ).get(item_id).total;
    var item = getItem(item_id);
    var esperada = item.cantidad_esperada;
    var estado = 'parcial';
    if (total >= esperada && esperada > 0) estado = 'completo';
    else if (total === 0) estado = 'pendiente';
    db.prepare(
      'UPDATE items SET cantidad_controlada = ?, bultos = (SELECT COALESCE(SUM(bultos),0) FROM controles_parciales WHERE item_id = ?), estado = ? WHERE id = ?'
    ).run(total, item_id, estado, item_id);
    return { total, estado };
  });
  return txn();
}

function getControlesParciales(item_id) {
  return db.prepare(
    'SELECT * FROM controles_parciales WHERE item_id = ? ORDER BY created_at DESC'
  ).all(item_id);
}

function setCantidadCaja(item_id, cantidad_caja) {
  db.prepare('UPDATE items SET cantidad_caja = ? WHERE id = ?').run(cantidad_caja, item_id);
}

function actualizarEstadoImportacion(id) {
  var items = getItemsByImportacion(id);
  var total = items.length;
  if (total === 0) return;
  var completos = items.filter(i => i.estado === 'completo').length;
  var estado = 'abierto';
  if (completos === total) estado = 'completo';
  else if (completos > 0 || items.some(i => i.estado === 'parcial')) estado = 'parcial';
  db.prepare('UPDATE importaciones SET estado = ? WHERE id = ?').run(estado, id);
}

function eliminarControl(item_id, control_id) {
  var txn = db.transaction(() => {
    db.prepare('DELETE FROM controles_parciales WHERE id = ? AND item_id = ?').run(control_id, item_id);
    var total = db.prepare(
      'SELECT COALESCE(SUM(cantidad),0) AS total FROM controles_parciales WHERE item_id = ?'
    ).get(item_id).total;
    var item = getItem(item_id);
    var esperada = item.cantidad_esperada;
    var estado = 'pendiente';
    if (total > 0 && total < esperada) estado = 'parcial';
    else if (total >= esperada && esperada > 0) estado = 'completo';
    else if (total > 0 && esperada === 0) estado = 'parcial';
    db.prepare(
      'UPDATE items SET cantidad_controlada = ?, bultos = (SELECT COALESCE(SUM(bultos),0) FROM controles_parciales WHERE item_id = ?), estado = ? WHERE id = ?'
    ).run(total, item_id, estado, item_id);
  });
  txn();
}

// Calidad
function guardarCalidad(importacion_id, data) {
  var existing = db.prepare('SELECT id FROM calidad_checklist WHERE importacion_id = ?').get(importacion_id);
  if (existing) {
    db.prepare(`
      UPDATE calidad_checklist SET
        cajas_buen_estado = ?, codigos_correctos = ?, cajas_enumeradas = ?,
        items_separados = ?, embalaje_correcto = ?, tiene_codigos_barra = ?,
        observaciones = ?
      WHERE importacion_id = ?
    `).run(data.cajas_buen_estado, data.codigos_correctos, data.cajas_enumeradas,
      data.items_separados, data.embalaje_correcto, data.tiene_codigos_barra,
      data.observaciones, importacion_id);
  } else {
    db.prepare(`
      INSERT INTO calidad_checklist (importacion_id, cajas_buen_estado, codigos_correctos,
        cajas_enumeradas, items_separados, embalaje_correcto, tiene_codigos_barra, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(importacion_id, data.cajas_buen_estado, data.codigos_correctos,
      data.cajas_enumeradas, data.items_separados, data.embalaje_correcto,
      data.tiene_codigos_barra, data.observaciones);
  }
}

function getCalidad(importacion_id) {
  return db.prepare('SELECT * FROM calidad_checklist WHERE importacion_id = ?').get(importacion_id) || null;
}

// Cerrar importación
function cerrarImportacion(id) {
  db.prepare("UPDATE importaciones SET estado = 'cerrado' WHERE id = ?").run(id);
}

module.exports = {
  getProveedores,
  getOrCreateProveedor,
  crearImportacion,
  actualizarImportacion,
  agregarItem,
  actualizarItem,
  getImportaciones,
  getImportacion,
  getItemsByImportacion,
  getItem,
  controlarItem,
  getControlesParciales,
  setCantidadCaja,
  actualizarEstadoImportacion,
  eliminarControl,
  guardarCalidad,
  getCalidad,
  cerrarImportacion,
  prepare: (sql) => db.prepare(sql),
};
