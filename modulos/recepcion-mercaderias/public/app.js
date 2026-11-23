let importData = null;
let importStep = 1;
let currentProveedores = [];
let selectedProveedor = null;
let currentDetailId = null;

document.addEventListener('DOMContentLoaded', () => {
  initUploadZone();
  initProveedorCombo();
  navigate('dashboard');
});

async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(err.error || 'Error desconocido');
  }
  return res.json();
}

/* Navigation */
let _lastNavView = null;
function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  const target = document.getElementById('view-' + view);
  target.style.display = 'flex';
  document.querySelectorAll('.sidebar-icon').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.sidebar-icon[data-view="${view}"]`);
  if (btn) {
    const was = btn.classList.contains('active');
    btn.classList.add('active');
    if (!was && window.gsap) gsap.fromTo(btn, { scale: 0.78 }, { scale: 1, duration: 0.4, ease: 'back.out(2.2)', clearProps: 'transform' });
  }
  // Entrada orquestada de la vista (patrón Control de Facturas)
  if (view !== _lastNavView && window.gsap) {
    const kids = Array.from(target.children).slice(0, 8);
    if (kids.length) { gsap.killTweensOf(kids); gsap.from(kids, { opacity: 0, y: 14, duration: 0.42, stagger: 0.06, ease: 'power3.out', clearProps: 'all' }); }
  }
  _lastNavView = view;
  if (view === 'dashboard') renderDashboard();
  if (view === 'importar') resetImport();
  if (view === 'proveedores') renderProveedores();
}
/* Cascada de filas de tabla (patrón Control de Facturas) */
function staggerRows(tbody) {
  if (!tbody || !window.gsap) return;
  const rows = tbody.querySelectorAll('tr');
  if (rows.length) gsap.from(rows, { opacity: 0, x: -10, duration: 0.3, stagger: Math.min(0.03, 0.4 / rows.length), ease: 'power2.out', clearProps: 'all' });
}

/* Dashboard */
async function renderDashboard() {
  try {
    const [importaciones, proveedores] = await Promise.all([
      api('/api/importaciones'),
      api('/api/proveedores'),
    ]);

    currentProveedores = proveedores;
    const filterProv = document.getElementById('filterProveedor');
    const filterEstado = document.getElementById('filterEstado');
    const currentProv = filterProv.value;
    filterProv.innerHTML = '<option value="">Todos los proveedores</option>' +
      proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    filterProv.value = currentProv;

    let filtered = importaciones;
    if (filterProv.value) filtered = filtered.filter(i => i.proveedor_id == filterProv.value);
    if (filterEstado.value) filtered = filtered.filter(i => i.estado === filterEstado.value);

    const stats = { total: importaciones.length, abierto: 0, parcial: 0, completo: 0 };
    importaciones.forEach(i => { if (stats[i.estado] !== undefined) stats[i.estado]++; });

    animateKpi('statTotal', stats.total);
    animateKpi('statAbierto', stats.abierto);
    animateKpi('statParcial', stats.parcial);
    animateKpi('statCompleto', stats.completo);

    const tbody = document.getElementById('dashboardBody');
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray-400)">No hay importaciones registradas</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(i => {
      return `<tr>
        <td style="white-space:nowrap">${formatDate(i.fecha_importacion)}</td>
        <td><strong>${i.proveedor_nombre}</strong></td>
        <td style="font-family:monospace">${i.doc_compras || '-'}</td>
        <td id="itemsCount-${i.id}">...</td>
        <td id="controlCount-${i.id}">...</td>
        <td><span class="badge badge-${i.estado}">${estadoLabel(i.estado)}</span></td>
        <td><button class="btn btn-sm btn--secondary" onclick="verDetalle(${i.id})">Ver</button></td>
      </tr>`;
    }).join('');
    staggerRows(tbody);

    for (const i of filtered) {
      const det = await api(`/api/importaciones/${i.id}`);
      const items = det.items || [];
      const total = items.length;
      const controlados = items.filter(it => it.estado !== 'pendiente').length;
      document.getElementById(`itemsCount-${i.id}`).textContent = total;
      document.getElementById(`controlCount-${i.id}`).textContent = `${controlados}/${total}`;
    }
  } catch (err) {
    console.error(err);
  }
}

function estadoLabel(e) {
  return { abierto: 'Abierto', parcial: 'Parcial', completo: 'Completo', pendiente: 'Pendiente', cerrado: 'Cerrado' }[e] || e;
}

function formatDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* Proveedores View */
async function renderProveedores() {
  try {
    const proveedores = await api('/api/proveedores');
    let html = '<div class="detail-table-wrap"><table class="detail-items-table"><thead><tr><th>Proveedor</th><th>Importaciones</th><th>Acción</th></tr></thead><tbody>';
    for (const p of proveedores) {
      const imps = await api(`/api/proveedores/${p.id}/importaciones`);
      html += `<tr>
        <td><strong>${p.nombre}</strong></td>
        <td>${imps.length} importaciones</td>
        <td><button class="btn btn-sm btn--secondary" onclick="filtrarProveedor(${p.id})">Ver importaciones</button></td>
      </tr>`;
    }
    html += '</tbody></table></div>';
    if (!proveedores.length) html = '<p style="padding:24px;color:var(--gray-400)">No hay proveedores registrados</p>';
    document.getElementById('proveedoresContent').innerHTML = html;
  } catch (err) {
    document.getElementById('proveedoresContent').innerHTML = `<p style="padding:24px;color:var(--danger)">Error: ${err.message}</p>`;
  }
}

function filtrarProveedor(id) {
  document.getElementById('filterProveedor').value = id;
  navigate('dashboard');
}

/* Proveedor Combo */
function initProveedorCombo() {
  const control = document.querySelector('[data-combo="proveedorCombo"]');
  if (!control) return;
  const menu = document.getElementById('proveedorMenu');
  const search = document.getElementById('proveedorSearch');
  const list = document.getElementById('proveedorList');
  const display = document.getElementById('proveedorDisplay');

  control.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
    control.classList.toggle('is-open');
    if (menu.classList.contains('open')) { search.value = ''; search.focus(); renderProveedorList(); }
  });

  search.addEventListener('input', renderProveedorList);

  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && search.value.trim()) {
      selectProveedor({ id: -1, nombre: search.value.trim().toUpperCase() });
      menu.classList.remove('open');
      control.classList.remove('is-open');
    }
  });

  document.addEventListener('click', () => { menu.classList.remove('open'); control.classList.remove('is-open'); });
  menu.addEventListener('click', (e) => e.stopPropagation());
}

function renderProveedorList() {
  const search = document.getElementById('proveedorSearch');
  const list = document.getElementById('proveedorList');
  const q = search.value.toLowerCase().trim();
  let filtered = currentProveedores.filter(p => p.nombre.toLowerCase().includes(q));
  if (q && !filtered.some(p => p.nombre.toLowerCase() === q)) {
    filtered.unshift({ id: -1, nombre: q.toUpperCase(), _new: true });
  }
  list.innerHTML = filtered.map(p => {
    const isNew = p._new;
    return `<div class="combo-item ${selectedProveedor && selectedProveedor.id === p.id ? 'selected' : ''}" data-id="${p.id}" data-nombre="${p.nombre}">
      <span>${p.nombre}</span>
      ${isNew ? '<span style="font-size:10px;color:var(--accent);font-weight:800">NUEVO</span>' : ''}
    </div>`;
  }).join('');
  list.querySelectorAll('.combo-item').forEach(el => {
    el.addEventListener('click', () => {
      selectProveedor({ id: parseInt(el.dataset.id), nombre: el.dataset.nombre });
      document.getElementById('proveedorMenu').classList.remove('open');
      document.querySelector('[data-combo="proveedorCombo"]').classList.remove('is-open');
    });
  });
}

function selectProveedor(p) {
  selectedProveedor = p;
  const display = document.getElementById('proveedorDisplay');
  display.textContent = p.nombre;
  document.querySelector('[data-combo="proveedorCombo"]').classList.add('has-value');
}

/* Import Wizard */
// (importStep ya está declarado arriba — la doble declaración con `let` rompía todo el script)
let importFile = null;
let importSheets = null;
let selectedSheet = 0;

function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => { if (input.files.length) handleFile(input.files[0]); });
}

async function handleFile(file) {
  importFile = file;
  document.getElementById('uploadZone').style.display = 'none';
  const fi = document.getElementById('fileInfo');
  fi.style.display = 'flex';
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('previewLoading').style.display = 'block';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/importaciones/preview', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Error al procesar archivo');
    const data = await res.json();
    importData = data;
    importSheets = data.sheets;
    selectedSheet = 0;

    if (data.posibleNombreProveedor) {
      const p = { id: -1, nombre: data.posibleNombreProveedor.toUpperCase() };
      selectProveedor(p);
    }
    if (data.posibleDocCompras) {
      document.getElementById('docCompras').value = data.posibleDocCompras;
    }

    document.getElementById('previewLoading').style.display = 'none';
    populateSheetSelect();
    onSheetChange();
    importGoToStep(2);
  } catch (err) {
    document.getElementById('previewLoading').style.display = 'none';
    alert('Error al leer el archivo: ' + err.message);
    resetImport();
  }
}

function populateSheetSelect() {
  const sel = document.getElementById('sheetSelect');
  sel.innerHTML = importSheets.map((s, i) => `<option value="${i}">${s.name} (${s.rows.length} filas)</option>`).join('');
}

function onSheetChange() {
  const sel = document.getElementById('sheetSelect');
  selectedSheet = parseInt(sel.value);
  const sheet = importSheets[selectedSheet];
  if (!sheet || !sheet.rows.length) return;

  const headerRow = sheet.rows[0] || [];
  const colSelects = ['colCodigo', 'colDescripcion', 'colCantidad'];
  const names = ['Código', 'Descripción', 'Cantidad'];

  colSelects.forEach((id, idx) => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">-- No usar --</option>' +
      headerRow.map((h, ci) => `<option value="${ci}">${h || `Columna ${ci + 1}`}</option>`).join('');

    const auto = autoMatchColumn(headerRow, names[idx]);
    if (auto >= 0) sel.value = auto;
  });

  renderPreview();
}

function autoMatchColumn(headers, term) {
  const lower = term.toLowerCase();
  return headers.findIndex(h => {
    if (!h) return false;
    const s = String(h).toLowerCase();
    return s.includes(lower) || lower.includes(s);
  });
}

function renderPreview() {
  const sheet = importSheets[selectedSheet];
  if (!sheet) return;
  const colC = parseInt(document.getElementById('colCodigo').value);
  const colD = parseInt(document.getElementById('colDescripcion').value);
  const colQ = parseInt(document.getElementById('colCantidad').value);

  const head = document.getElementById('previewHead');
  const body = document.getElementById('previewBody');
  const count = document.getElementById('previewCount');

  const rows = sheet.rows;
  const maxPreview = Math.min(rows.length, 200);

  let theadHtml = '<tr><th>#</th>';
  theadHtml += `<th>Código${colC >= 0 ? ` ← Col ${colC + 1}` : ''}</th>`;
  theadHtml += `<th>Descripción${colD >= 0 ? ` ← Col ${colD + 1}` : ''}</th>`;
  theadHtml += `<th>Cant. Esperada${colQ >= 0 ? ` ← Col ${colQ + 1}` : ''}</th>`;
  theadHtml += '</tr>';
  head.innerHTML = theadHtml;

  let items = [];
  for (let i = 1; i < maxPreview; i++) {
    const row = rows[i];
    const codigo = colC >= 0 && colC < row.length ? String(row[colC] ?? '').trim() : '';
    const descripcion = colD >= 0 && colD < row.length ? String(row[colD] ?? '').trim() : '';
    const cantidad = colQ >= 0 && colQ < row.length ? parseInt(row[colQ]) || 0 : 0;
    if (!codigo && !descripcion) continue;
    items.push({ codigo, descripcion, cantidad_esperada: cantidad });
  }

  body.innerHTML = items.map((item, idx) => {
    return `<tr>
      <td style="color:var(--gray-400)">${idx + 1}</td>
      <td style="font-family:monospace;font-size:11px">${item.codigo || '-'}</td>
      <td>${item.descripcion || '-'}</td>
      <td style="text-align:center;font-weight:800">${item.cantidad_esperada || '-'}</td>
    </tr>`;
  }).join('');
  staggerRows(body);
  count.textContent = `(${items.length} items)`;
}

function importGoToStep(step) {
  importStep = step;
  document.querySelectorAll('.wizard-step').forEach(s => s.style.display = 'none');
  const stepEl = document.getElementById('importStep' + step);
  stepEl.style.display = 'flex';
  // Entrada animada del paso del wizard
  if (window.gsap) { const kids = Array.from(stepEl.children).slice(0, 6); if (kids.length) gsap.from(kids, { opacity: 0, y: 12, duration: 0.36, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }); }
  document.getElementById('importProgress').style.width = (step / 3 * 100) + '%';
  document.getElementById('importCounter').textContent = `Paso ${step} de 3`;
  document.getElementById('importBackBtn').style.display = step === 1 ? 'none' : 'inline-flex';
  document.getElementById('importNextBtn').style.display = step === 3 ? 'none' : 'inline-flex';
  document.getElementById('importSaveBtn').style.display = step === 3 ? 'inline-flex' : 'none';
  if (step === 3) renderConfirm();
}

function importNext() {
  if (importStep === 1) {
    if (!importFile) { alert('Seleccioná un archivo Excel primero'); return; }
    importGoToStep(2);
  } else if (importStep === 2) {
    if (!selectedProveedor || !selectedProveedor.nombre) { alert('Seleccioná o escribí un proveedor'); return; }
    importGoToStep(3);
  }
}

function importBack() {
  if (importStep > 1) importGoToStep(importStep - 1);
}

function renderConfirm() {
  const sheet = importSheets[selectedSheet];
  const colC = parseInt(document.getElementById('colCodigo').value);
  const colD = parseInt(document.getElementById('colDescripcion').value);
  const colQ = parseInt(document.getElementById('colCantidad').value);
  const rows = sheet.rows;

  let items = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const codigo = colC >= 0 && colC < row.length ? String(row[colC] ?? '').trim() : '';
    const descripcion = colD >= 0 && colD < row.length ? String(row[colD] ?? '').trim() : '';
    const cantidad = colQ >= 0 && colQ < row.length ? parseInt(row[colQ]) || 0 : 0;
    if (!codigo && !descripcion) continue;
    items.push({ codigo, descripcion, cantidad_esperada: cantidad, cantidad_caja: 1 });
  }

  document.getElementById('confirmBody').innerHTML = items.map((item, idx) => {
    return `<tr>
      <td style="font-family:monospace;font-size:12px">${item.codigo || '-'}</td>
      <td>${item.descripcion || '-'}</td>
      <td style="text-align:center;font-weight:800">${item.cantidad_esperada || '-'}</td>
      <td style="text-align:center"><input type="number" class="w-input" style="width:70px;height:32px;text-align:center;margin:0 auto" value="${item.cantidad_caja}" min="1" data-idx="${idx}" onchange="updateCaja(${idx}, this.value)"></td>
    </tr>`;
  }).join('');

  const totalItems = items.length;
  const totalCant = items.reduce((s, i) => s + (i.cantidad_esperada || 0), 0);

  document.getElementById('confirmSummary').innerHTML = `
    <div class="confirm-card">
      <div class="confirm-card-label">Proveedor</div>
      <div class="confirm-card-value">${selectedProveedor.nombre}</div>
    </div>
    <div class="confirm-card">
      <div class="confirm-card-label">Items</div>
      <div class="confirm-card-value">${totalItems}</div>
    </div>
    <div class="confirm-card">
      <div class="confirm-card-label">Cant. Total</div>
      <div class="confirm-card-value">${totalCant}</div>
    </div>
  `;
}

function updateCaja(idx, val) {
  // stored in items array via data attribute
}

async function saveImport() {
  const sheet = importSheets[selectedSheet];
  const colC = parseInt(document.getElementById('colCodigo').value);
  const colD = parseInt(document.getElementById('colDescripcion').value);
  const colQ = parseInt(document.getElementById('colCantidad').value);
  const rows = sheet.rows;

  let items = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const codigo = colC >= 0 && colC < row.length ? String(row[colC] ?? '').trim() : '';
    const descripcion = colD >= 0 && colD < row.length ? String(row[colD] ?? '').trim() : '';
    const cantidad = colQ >= 0 && colQ < row.length ? parseInt(row[colQ]) || 0 : 0;
    if (!codigo && !descripcion) continue;
    const cajaInput = document.querySelector(`input[data-idx="${items.length}"]`);
    const caja = cajaInput ? parseInt(cajaInput.value) || 1 : 1;
    items.push({ codigo, descripcion, cantidad_esperada: cantidad, cantidad_caja: caja });
  }

  const proveedor = selectedProveedor.nombre;
  const doc_compras = document.getElementById('docCompras').value.trim();
  const observaciones = document.getElementById('observaciones').value.trim();

  const saveBtn = document.getElementById('importSaveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando...';

  try {
    const result = await api('/api/importaciones', {
      method: 'POST',
      body: JSON.stringify({ proveedor, doc_compras, observaciones, items }),
    });
    alert(`Importación #${result.id} creada con éxito (${items.length} items)`);
    resetImport();
    navigate('dashboard');
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar Importación';
  }
}

function resetImport() {
  importStep = 1;
  importFile = null;
  importData = null;
  importSheets = null;
  selectedSheet = 0;
  selectedProveedor = null;
  document.getElementById('uploadZone').style.display = 'block';
  document.getElementById('fileInfo').style.display = 'none';
  document.getElementById('previewLoading').style.display = 'none';
  document.getElementById('fileInput').value = '';
  document.getElementById('proveedorDisplay').textContent = 'Seleccionar proveedor';
  document.querySelector('[data-combo="proveedorCombo"]').classList.remove('has-value');
  document.getElementById('docCompras').value = '';
  document.getElementById('observaciones').value = '';
  importGoToStep(1);
}

/* Detail View */
async function verDetalle(id) {
  currentDetailId = id;
  navigate('detalle');
  try {
    const data = await api(`/api/importaciones/${id}`);
    const imp = data;
    const items = data.items || [];

    document.getElementById('detailTitle').textContent = `Importación #${imp.id}`;
    const isCerrado = imp.estado === 'cerrado';
    const calidad = imp.calidad;

    let html = `
      <div class="detail-header-card">
        <div class="detail-fields-grid">
          <div class="detail-field"><div class="detail-field-label">Proveedor</div><div class="detail-field-value">${imp.proveedor_nombre}</div></div>
          <div class="detail-field"><div class="detail-field-label">Doc. Compras</div><div class="detail-field-value">${imp.doc_compras || '-'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Fecha Importación</div><div class="detail-field-value">${formatDate(imp.fecha_importacion)}</div></div>
          <div class="detail-field"><div class="detail-field-label">Estado</div><div class="detail-field-value"><span class="badge badge-${imp.estado}">${estadoLabel(imp.estado)}</span></div></div>
          <div class="detail-field"><div class="detail-field-label">Fecha Descarga</div><div class="detail-field-value">${imp.fecha_descarga || '<em style="color:var(--gray-300)">Sin completar</em>'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Controlado Por</div><div class="detail-field-value">${imp.controlado_por || '<em style="color:var(--gray-300)">Sin completar</em>'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Bultos PL / Recibidos</div><div class="detail-field-value">${imp.bultos_pl || 0} / ${imp.bultos_recibidos || 0}</div></div>
          <div class="detail-field"><div class="detail-field-label">Contenedor</div><div class="detail-field-value">${imp.tipo_contenedor || '-'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Estibador</div><div class="detail-field-value">${imp.estibador || '-'}</div></div>
          <div class="detail-field"><div class="detail-field-label">Cód. Barra Origen</div><div class="detail-field-value">${imp.tiene_codigo_barra ? 'Sí' : 'No'}</div></div>
        </div>
        <div class="detail-actions-bar">
          ${!isCerrado ? `<button class="btn btn-sm btn--secondary" onclick="abrirEditarCabecera(${imp.id})">✏️ Editar Cabecera</button>` : ''}
          <button class="btn btn-sm btn--secondary" onclick="abrirCalidad(${imp.id})">${calidad ? '✅ Ver Calidad' : '📋 Evaluar Calidad'}</button>
          <button class="btn btn-sm btn--primary" onclick="exportarReporte(${imp.id})">📥 Exportar Reporte</button>
          ${!isCerrado && imp.estado === 'completo' ? `<button class="btn btn-sm btn-warning" onclick="cerrarImportacion(${imp.id})">🔒 Cerrar</button>` : ''}
        </div>
      </div>

      ${calidad ? `<div class="calidad-strip">
        <span class="calidad-chip calidad-${(calidad.cajas_buen_estado||'').toLowerCase()}">Cajas: ${calidad.cajas_buen_estado || '-'}</span>
        <span class="calidad-chip calidad-${(calidad.codigos_correctos||'').toLowerCase()}">Códigos: ${calidad.codigos_correctos || '-'}</span>
        <span class="calidad-chip calidad-${(calidad.embalaje_correcto||'').toLowerCase()}">Embalaje: ${calidad.embalaje_correcto || '-'}</span>
      </div>` : ''}

      <div class="detail-table-wrap">
        <table class="detail-items-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>UNM</th>
              <th>Cant. SAP</th>
              <th>Recibida</th>
              <th>Faltante</th>
              <th>Sobrante</th>
              <th>Progreso</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const item of items) {
      const pct = item.cantidad_esperada > 0 ? Math.min(100, Math.round(item.cantidad_controlada / item.cantidad_esperada * 100)) : 0;
      const progressClass = item.estado === 'completo' ? 'complete' : item.estado === 'parcial' ? 'partial' : 'pending';
      const faltante = Math.max(0, item.cantidad_esperada - item.cantidad_controlada);
      const sobrante = Math.max(0, item.cantidad_controlada - item.cantidad_esperada);
      html += `
        <tr>
          <td style="font-family:monospace;font-size:12px">${item.codigo || '-'}</td>
          <td>${item.descripcion || '-'}</td>
          <td style="text-align:center;font-size:11px;color:var(--gray-400)">${item.unm || 'UN'}</td>
          <td style="text-align:center;font-weight:800">${item.cantidad_esperada || '-'}</td>
          <td style="text-align:center;font-weight:800;color:var(--primary)">${item.cantidad_controlada}</td>
          <td style="text-align:center;font-weight:700;color:${faltante > 0 ? 'var(--danger)' : 'var(--gray-300)'}">${faltante || '-'}</td>
          <td style="text-align:center;font-weight:700;color:${sobrante > 0 ? 'var(--warning)' : 'var(--gray-300)'}">${sobrante || '-'}</td>
          <td>
            <div class="progress-bar-cont">
              <div class="progress-track">
                <div class="progress-fill ${progressClass}" style="width:${pct}%"></div>
              </div>
              <span style="font-size:11px;font-weight:700;color:var(--gray-400)">${pct}%</span>
            </div>
          </td>
          <td><span class="badge badge-${item.estado}">${estadoLabel(item.estado)}</span></td>
          <td>
            <button class="btn btn-sm ${item.estado === 'completo' ? 'btn--secondary' : 'btn-success'}" onclick="abrirControl(${item.id})" ${isCerrado ? 'disabled' : ''}>
              ${item.estado === 'completo' ? 'Ver' : 'Controlar'}
            </button>
          </td>
        </tr>
      `;
    }

    html += '</tbody></table></div>';
    document.getElementById('detailContent').innerHTML = html;
    staggerRows(document.getElementById('detailContent'));
  } catch (err) {
    document.getElementById('detailContent').innerHTML = `<p style="padding:24px;color:var(--danger)">Error: ${err.message}</p>`;
  }
}

async function updateCantidadCaja(itemId, val) {
  const caja = parseInt(val);
  if (caja < 1) return;
  try {
    await api(`/api/items/${itemId}/cantidad-caja`, {
      method: 'PUT',
      body: JSON.stringify({ cantidad_caja: caja }),
    });
  } catch (err) {
    console.error(err);
  }
}

/* Control Modal */
let currentControlItemId = null;

async function abrirControl(itemId) {
  currentControlItemId = itemId;
  try {
    const data = await api(`/api/items/${itemId}`);
    const item = data;

    document.getElementById('controlItemInfo').innerHTML = `
      <div class="ci-code">${item.codigo || 'Sin código'}</div>
      <div class="ci-desc">${item.descripcion || 'Sin descripción'}</div>
      <div class="ci-expected">Cantidad esperada: <strong>${item.cantidad_esperada}</strong> | Cant. por caja: <strong>${item.cantidad_caja}</strong></div>
    `;

    renderControlTotals(item);
    renderControlLog(data.controles || []);

    document.getElementById('controlCantidad').value = item.cantidad_caja;
    document.getElementById('controlBultos').value = 1;
    document.getElementById('controlCantidad').focus();

    document.getElementById('controlModal').classList.add('open');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function closeControlModal() {
  document.getElementById('controlModal').classList.remove('open');
  currentControlItemId = null;
}

function renderControlTotals(item) {
  const esperada = item.cantidad_esperada || 0;
  const controlada = item.cantidad_controlada || 0;
  const restante = Math.max(0, esperada - controlada);
  document.getElementById('controlTotals').innerHTML = `
    <div class="control-total-item">
      <div class="ct-label">Controlado</div>
      <div class="ct-value done">${controlada}</div>
    </div>
    <div class="control-total-item">
      <div class="ct-label">Pendiente</div>
      <div class="ct-value ${restante > 0 ? 'pending' : 'done'}">${restante}</div>
    </div>
  `;
}

function renderControlLog(controles) {
  const list = document.getElementById('controlLogList');
  if (!controles.length) {
    list.innerHTML = '<div class="control-log-empty">Sin controles registrados aún</div>';
    return;
  }
  list.innerHTML = controles.map(c => `
    <div class="control-log-entry">
      <span class="cl-cant">+${c.cantidad}</span>
      <span style="color:var(--gray-500)">${c.bultos > 0 ? `${c.bultos} bulto(s)` : ''}</span>
      <span class="cl-date">${formatDate(c.created_at)}</span>
      <button class="cl-del" onclick="eliminarControl(${c.item_id}, ${c.id})" title="Eliminar">&times;</button>
    </div>
  `).join('');
  if (window.gsap) gsap.from(list.querySelectorAll('.control-log-entry'), { opacity: 0, x: -8, duration: 0.26, stagger: 0.03, ease: 'power2.out', clearProps: 'all' });
}

async function saveControl() {
  const cantidad = parseInt(document.getElementById('controlCantidad').value);
  const bultos = parseInt(document.getElementById('controlBultos').value) || 0;
  if (!cantidad || cantidad < 1) { alert('Ingresá una cantidad válida'); return; }

  try {
    const result = await api(`/api/items/${currentControlItemId}/controlar`, {
      method: 'POST',
      body: JSON.stringify({ cantidad, bultos }),
    });

    const data = await api(`/api/items/${currentControlItemId}`);
    renderControlTotals(data);
    renderControlLog(data.controles || []);
    document.getElementById('controlCantidad').value = bultos > 0 ? Math.max(1, Math.floor(cantidad / Math.max(1, bultos))) : data.cantidad_caja;
    document.getElementById('controlBultos').value = 1;
    document.getElementById('controlCantidad').focus();

    if (currentDetailId) verDetalle(currentDetailId);
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
}

async function eliminarControl(itemId, controlId) {
  if (!confirm('¿Eliminar este control?')) return;
  try {
    await api(`/api/items/${itemId}/controles/${controlId}`, { method: 'DELETE' });
    if (currentControlItemId) {
      const data = await api(`/api/items/${currentControlItemId}`);
      renderControlTotals(data);
      renderControlLog(data.controles || []);
    }
    if (currentDetailId) verDetalle(currentDetailId);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

/* Editar Cabecera */
async function abrirEditarCabecera(id) {
  const data = await api(`/api/importaciones/${id}`);
  const m = document.getElementById('controlModal');
  document.getElementById('controlModalTitle').textContent = 'Editar Cabecera';
  document.getElementById('controlItemInfo').innerHTML = '';
  document.getElementById('controlTotals').innerHTML = '';
  document.getElementById('controlLog').style.display = 'none';
  document.getElementById('controlModal').querySelector('.modal-body .control-form').innerHTML = `
    <div class="field"><label>Fecha Descarga</label><input type="date" id="editFechaDescarga" class="w-input" value="${data.fecha_descarga || ''}"></div>
    <div class="field"><label>Fecha Control Final</label><input type="date" id="editFechaControl" class="w-input" value="${data.fecha_control_final || ''}"></div>
    <div class="field"><label>Controlado Por</label><input type="text" id="editControlador" class="w-input" value="${data.controlado_por || ''}"></div>
    <div class="field"><label>Bultos PL</label><input type="number" id="editBultosPl" class="w-input" value="${data.bultos_pl || 0}"></div>
    <div class="field"><label>Bultos Recibidos</label><input type="number" id="editBultosRec" class="w-input" value="${data.bultos_recibidos || 0}"></div>
    <div class="field"><label>Tipo Contenedor</label><select id="editContenedor" class="w-input">
      <option value="">Seleccionar...</option>
      <option value="20ft" ${data.tipo_contenedor === '20ft' ? 'selected' : ''}>20ft</option>
      <option value="40ft" ${data.tipo_contenedor === '40ft' ? 'selected' : ''}>40ft</option>
      <option value="LCL" ${data.tipo_contenedor === 'LCL' ? 'selected' : ''}>LCL</option>
      <option value="PALLET" ${data.tipo_contenedor === 'PALLET' ? 'selected' : ''}>PALLET</option>
    </select></div>
    <div class="field"><label>Estibador</label><input type="text" id="editEstibador" class="w-input" value="${data.estibador || ''}"></div>
    <div class="field"><label><input type="checkbox" id="editCodigoBarra" ${data.tiene_codigo_barra ? 'checked' : ''}> Tiene Código de Barra de Origen</label></div>
  `;
  currentControlItemId = null;
  m.querySelector('.modal-footer').innerHTML = `
    <button class="btn btn--secondary" onclick="closeEditModal()">Cancelar</button>
    <button class="btn btn--primary" onclick="guardarCabecera(${id})">Guardar</button>
  `;
  m.classList.add('open');
}

async function guardarCabecera(id) {
  try {
    await api(`/api/importaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        fecha_descarga: document.getElementById('editFechaDescarga').value || null,
        fecha_control_final: document.getElementById('editFechaControl').value || null,
        controlado_por: document.getElementById('editControlador').value || null,
        bultos_pl: parseInt(document.getElementById('editBultosPl').value) || 0,
        bultos_recibidos: parseInt(document.getElementById('editBultosRec').value) || 0,
        tipo_contenedor: document.getElementById('editContenedor').value || null,
        estibador: document.getElementById('editEstibador').value || null,
        tiene_codigo_barra: document.getElementById('editCodigoBarra').checked ? 1 : 0,
      }),
    });
    closeEditModal();
    verDetalle(id);
  } catch (err) { alert('Error: ' + err.message); }
}

/* Calidad */
async function abrirCalidad(id) {
  const calidad = await api(`/api/importaciones/${id}/calidad`);
  const m = document.getElementById('controlModal');
  document.getElementById('controlModalTitle').textContent = 'Checklist de Calidad';
  document.getElementById('controlItemInfo').innerHTML = '';
  document.getElementById('controlTotals').innerHTML = '';
  document.getElementById('controlLog').style.display = 'none';
  const opts = (field, val) => ['MALO','BUENO','EXCELENTE'].map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
  document.getElementById('controlModal').querySelector('.modal-body .control-form').innerHTML = `
    <div class="field"><label>Cajas en buen estado</label><select id="calCajas" class="w-input"><option value="">--</option>${opts('cajas', calidad.cajas_buen_estado)}</select></div>
    <div class="field"><label>Códigos correctos en cajas</label><select id="calCodigos" class="w-input"><option value="">--</option>${opts('cod', calidad.codigos_correctos)}</select></div>
    <div class="field"><label>Cajas enumeradas/identificadas</label><select id="calEnum" class="w-input"><option value="">--</option>${opts('enum', calidad.cajas_enumeradas)}</select></div>
    <div class="field"><label>Items separados correctamente</label><select id="calSep" class="w-input"><option value="">--</option>${opts('sep', calidad.items_separados)}</select></div>
    <div class="field"><label>Embalaje correcto</label><select id="calEmb" class="w-input"><option value="">--</option>${opts('emb', calidad.embalaje_correcto)}</select></div>
    <div class="field"><label>Códigos de barra por mercadería</label><select id="calBar" class="w-input"><option value="">--</option>${opts('bar', calidad.tiene_codigos_barra)}</select></div>
    <div class="field"><label>Observaciones</label><textarea id="calObs" class="w-input w-textarea">${calidad.observaciones || ''}</textarea></div>
  `;
  m.querySelector('.modal-footer').innerHTML = `
    <button class="btn btn--secondary" onclick="closeEditModal()">Cancelar</button>
    <button class="btn btn--primary" onclick="guardarCalidad(${id})">Guardar Calidad</button>
  `;
  m.classList.add('open');
}

async function guardarCalidad(id) {
  try {
    await api(`/api/importaciones/${id}/calidad`, {
      method: 'POST',
      body: JSON.stringify({
        cajas_buen_estado: document.getElementById('calCajas').value,
        codigos_correctos: document.getElementById('calCodigos').value,
        cajas_enumeradas: document.getElementById('calEnum').value,
        items_separados: document.getElementById('calSep').value,
        embalaje_correcto: document.getElementById('calEmb').value,
        tiene_codigos_barra: document.getElementById('calBar').value,
        observaciones: document.getElementById('calObs').value,
      }),
    });
    closeEditModal();
    verDetalle(id);
  } catch (err) { alert('Error: ' + err.message); }
}

function closeEditModal() {
  const m = document.getElementById('controlModal');
  m.classList.remove('open');
  document.getElementById('controlLog').style.display = '';
  m.querySelector('.modal-footer').innerHTML = `
    <button class="btn btn--secondary" onclick="closeControlModal()">Cerrar</button>
    <button class="btn btn--primary" onclick="saveControl()">Guardar Control</button>
  `;
}

/* Exportar */
function exportarReporte(id) {
  window.open(`/api/importaciones/${id}/exportar`, '_blank');
}

/* Cerrar importación */
async function cerrarImportacion(id) {
  if (!confirm('¿Cerrar esta importación? No se podrá editar después.')) return;
  try {
    await api(`/api/importaciones/${id}/cerrar`, { method: 'POST' });
    verDetalle(id);
  } catch (err) { alert('Error: ' + err.message); }
}

/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('controlModal').classList.contains('open')) closeControlModal();
  }
});

/* GSAP Animations */
function animateKpi(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!window.gsap) { el.textContent = target; return; }
  const from = parseInt(el.textContent) || 0;
  if (from === target) return;
  const card = el.closest('.stat-card');
  if (card) gsap.fromTo(card, { scale: 1 }, { scale: 1.02, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 });
  const obj = { n: from };
  gsap.to(obj, { n: target, duration: 0.6, ease: 'power2.out',
    onUpdate() { el.textContent = Math.round(obj.n); }
  });
}

function staggerRows(container) {
  if (!container) return;
  const rows = container.querySelectorAll('tbody tr');
  if (!rows.length) return;
  rows.forEach((r, i) => {
    r.style.animation = 'none';
    void r.offsetWidth;
    r.style.animation = '';
    r.style.animationDelay = (i * 0.04) + 's';
  });
}

const _origNavigate = navigate;
navigate = function (view) {
  _origNavigate(view);
  setTimeout(() => {
    const active = document.querySelector('.view[style*="flex"]');
    if (active) staggerRows(active);
  }, 100);
};
