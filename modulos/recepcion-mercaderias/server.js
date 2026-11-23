const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const db = require('./database');

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) cb(null, true);
    else cb(new Error('Solo archivos Excel (.xlsx, .xls) o CSV'));
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── PROVEEDORES ────────────────────────────────────────────
app.get('/api/proveedores', (req, res) => {
  res.json(db.getProveedores());
});

app.get('/api/proveedores/:id/importaciones', (req, res) => {
  var importaciones = db.prepare(`
    SELECT i.*, p.nombre AS proveedor_nombre
    FROM importaciones i
    JOIN proveedores p ON p.id = i.proveedor_id
    WHERE i.proveedor_id = ?
    ORDER BY i.fecha_importacion DESC
  `).all(req.params.id);
  res.json(importaciones);
});

// ── IMPORTACIONES ──────────────────────────────────────────
app.post('/api/importaciones/preview', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });
    var workbook = XLSX.readFile(req.file.path);
    var sheets = workbook.SheetNames.map(name => {
      var data = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '', header: 1 });
      var rows = data.filter(r => r.some(c => c !== '' && c !== null && c !== undefined));
      return { name, rows };
    });

    var posibleNombreProveedor = '';
    var posibleDocCompras = '';

    for (var s of sheets) {
      for (var row of s.rows) {
        var rowText = row.map(c => String(c)).join(' ').toUpperCase();
        if (rowText.includes('PROVEEDOR')) {
          var provVal = row[1] || row[2];
          if (provVal) {
            var clean = String(provVal).replace(/^\d+\s+/, '').trim();
            if (clean.length > 2) posibleNombreProveedor = clean;
          }
        }
        if (rowText.includes('DOCUMENTO') || rowText.includes('COMPRA')) {
          var match = String(row[1] || '').match(/(\d{10,})/);
          if (match) posibleDocCompras = match[1];
        }
      }
    }

    fs.unlink(req.file.path, () => {});
    res.json({ sheets, posibleNombreProveedor, posibleDocCompras });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/importaciones', (req, res) => {
  try {
    var { proveedor, doc_compras, observaciones, items: itemsData,
          fecha_descarga, fecha_control_final, controlado_por,
          bultos_pl, bultos_recibidos, tipo_contenedor,
          tiene_codigo_barra, estibador } = req.body;

    if (!proveedor || !proveedor.trim()) return res.status(400).json({ error: 'Proveedor es requerido' });
    if (!itemsData || !itemsData.length) return res.status(400).json({ error: 'Debe haber al menos un item' });

    var p = db.getOrCreateProveedor(proveedor);
    var importId = db.crearImportacion({
      proveedor_id: p.id,
      archivo_nombre: null,
      doc_compras: doc_compras || null,
      observaciones: observaciones || null,
      fecha_descarga: fecha_descarga || null,
      fecha_control_final: fecha_control_final || null,
      controlado_por: controlado_por || null,
      bultos_pl: bultos_pl || 0,
      bultos_recibidos: bultos_recibidos || 0,
      tipo_contenedor: tipo_contenedor || null,
      tiene_codigo_barra: tiene_codigo_barra || 0,
      estibador: estibador || null,
    });

    for (var item of itemsData) {
      db.agregarItem({
        importacion_id: importId,
        codigo: item.codigo || null,
        descripcion: item.descripcion || null,
        cantidad_esperada: parseInt(item.cantidad_esperada) || 0,
        cantidad_caja: parseInt(item.cantidad_caja) || 1,
        unm: item.unm || 'UN',
        codigo_barra: item.codigo_barra || null,
      });
    }

    res.json({ id: importId, message: 'Importación creada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/importaciones', (req, res) => {
  res.json(db.getImportaciones());
});

app.get('/api/importaciones/:id', (req, res) => {
  var imp = db.getImportacion(req.params.id);
  if (!imp) return res.status(404).json({ error: 'No encontrada' });
  var items = db.getItemsByImportacion(req.params.id);
  var calidad = db.getCalidad(req.params.id);
  res.json({ ...imp, items, calidad });
});

app.put('/api/importaciones/:id', (req, res) => {
  var imp = db.getImportacion(req.params.id);
  if (!imp) return res.status(404).json({ error: 'No encontrada' });
  if (imp.estado === 'cerrado') return res.status(400).json({ error: 'Importación cerrada, no se puede editar' });
  db.actualizarImportacion(req.params.id, req.body);
  res.json({ message: 'Actualizado' });
});

// ── CALIDAD ────────────────────────────────────────────────
app.post('/api/importaciones/:id/calidad', (req, res) => {
  var imp = db.getImportacion(req.params.id);
  if (!imp) return res.status(404).json({ error: 'No encontrada' });
  if (imp.estado === 'cerrado') return res.status(400).json({ error: 'Importación cerrada' });
  db.guardarCalidad(req.params.id, req.body);
  res.json({ message: 'Calidad guardada' });
});

app.get('/api/importaciones/:id/calidad', (req, res) => {
  var calidad = db.getCalidad(req.params.id);
  res.json(calidad || {});
});

// ── CERRAR IMPORTACIÓN ─────────────────────────────────────
app.post('/api/importaciones/:id/cerrar', (req, res) => {
  var imp = db.getImportacion(req.params.id);
  if (!imp) return res.status(404).json({ error: 'No encontrada' });
  db.cerrarImportacion(req.params.id);
  res.json({ message: 'Importación cerrada' });
});

// ── ITEMS ──────────────────────────────────────────────────
app.get('/api/items/:id', (req, res) => {
  var item = db.getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  var controles = db.getControlesParciales(req.params.id);
  res.json({ ...item, controles });
});

app.put('/api/items/:id', (req, res) => {
  var item = db.getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  db.actualizarItem(req.params.id, req.body);
  res.json({ message: 'Item actualizado' });
});

app.post('/api/items/:id/controlar', (req, res) => {
  var { cantidad, bultos } = req.body;
  if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'Cantidad inválida' });
  var item = db.getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item no encontrado' });
  var result = db.controlarItem({ item_id: parseInt(req.params.id), cantidad: parseInt(cantidad), bultos: parseInt(bultos) || 0 });
  db.actualizarEstadoImportacion(item.importacion_id);
  res.json(result);
});

app.put('/api/items/:id/cantidad-caja', (req, res) => {
  var { cantidad_caja } = req.body;
  if (!cantidad_caja || cantidad_caja <= 0) return res.status(400).json({ error: 'Cantidad de caja inválida' });
  db.setCantidadCaja(parseInt(req.params.id), parseInt(cantidad_caja));
  res.json({ message: 'Actualizado' });
});

app.delete('/api/items/:itemId/controles/:controlId', (req, res) => {
  db.eliminarControl(parseInt(req.params.itemId), parseInt(req.params.controlId));
  var item = db.getItem(req.params.itemId);
  if (item) db.actualizarEstadoImportacion(item.importacion_id);
  res.json({ message: 'Control eliminado' });
});

// ── EXPORTAR REPORTE ───────────────────────────────────────
app.get('/api/importaciones/:id/exportar', (req, res) => {
  var imp = db.getImportacion(req.params.id);
  if (!imp) return res.status(404).json({ error: 'No encontrada' });
  var items = db.getItemsByImportacion(req.params.id);
  var calidad = db.getCalidad(req.params.id);

  var wb = XLSX.utils.book_new();

  // Hoja 1: Cabecera
  var cabecera = [
    ['PLANILLA DE CONTROL'],
    ['Proveedor:', imp.proveedor_nombre],
    ['Doc. Compras:', imp.doc_compras || ''],
    ['Fecha Descarga:', imp.fecha_descarga || ''],
    ['Fecha Control Final:', imp.fecha_control_final || ''],
    ['Controlado Por:', imp.controlado_por || ''],
    ['Bultos PL:', imp.bultos_pl || 0],
    ['Bultos Recibidos:', imp.bultos_recibidos || 0],
    ['Tipo Contenedor:', imp.tipo_contenedor || ''],
    ['Código Barra Origen:', imp.tiene_codigo_barra ? 'Sí' : 'No'],
    ['Estibador:', imp.estibador || ''],
    ['Observaciones:', imp.observaciones || ''],
    ['Estado:', imp.estado],
    [],
    ['CHECKLIST DE CALIDAD'],
  ];
  if (calidad) {
    cabecera.push(['Cajas en buen estado:', calidad.cajas_buen_estado || '']);
    cabecera.push(['Códigos correctos:', calidad.codigos_correctos || '']);
    cabecera.push(['Cajas enumeradas:', calidad.cajas_enumeradas || '']);
    cabecera.push(['Items separados:', calidad.items_separados || '']);
    cabecera.push(['Embalaje correcto:', calidad.embalaje_correcto || '']);
    cabecera.push(['Códigos de barra:', calidad.tiene_codigos_barra || '']);
    cabecera.push(['Obs. calidad:', calidad.observaciones || '']);
  }

  cabecera.push([]);
  cabecera.push(['CODIGO', 'DESCRIPCION', 'UNM', 'CANT. SAP', 'CANT. RECIBIDA', 'FALTANTE', 'SOBRANTE', 'ESTADO', 'COD. BARRA']);
  items.forEach(it => {
    var faltante = Math.max(0, it.cantidad_esperada - it.cantidad_controlada);
    var sobrante = Math.max(0, it.cantidad_controlada - it.cantidad_esperada);
    cabecera.push([it.codigo, it.descripcion, it.unm || 'UN', it.cantidad_esperada, it.cantidad_controlada, faltante, sobrante, it.estado, it.codigo_barra || '']);
  });

  var ws = XLSX.utils.aoa_to_sheet(cabecera);
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

  var buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  var filename = `Reporte_${imp.proveedor_nombre}_${imp.doc_compras || 'sin-doc'}.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// ── ERROR HANDLER ──────────────────────────────────────────
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
