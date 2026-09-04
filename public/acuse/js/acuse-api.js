/* ============================================================================
 * acuse-api.js — Adaptador AcuseAPI → Supabase (reemplaza el cliente HTTP /api)
 * ----------------------------------------------------------------------------
 * El frontend de ACUSE llama a window.AcuseAPI.{get,post,put,patch,delete}
 * contra rutas /api/*. Este adaptador enruta esas rutas a Supabase (supabase-js)
 * devolviendo EXACTAMENTE las mismas formas que el backend Node/MySQL original,
 * mapeando el schema snake_case de Supabase a los nombres del contrato.
 *
 * Config (la pasa el apartado React por query string del iframe):
 *   ?sb=<SUPABASE_URL>&key=<ANON_KEY>&user=<Nombre Usuario>
 * La anon key es pública por diseño (RLS anon). El gate real es el SSO ALAS.
 * ========================================================================== */
(function () {
  'use strict';

  var P = new URLSearchParams(location.search);
  function storedCfg() { try { return JSON.parse(sessionStorage.getItem('acuse.cfg') || '{}'); } catch (_) { return {}; } }
  function lsUser() { try { return (JSON.parse(localStorage.getItem('alas.current_user') || '{}').name) || ''; } catch (_) { return ''; } }
  var _s = storedCfg();
  // La config llega por query del iframe la 1ª vez y se persiste para que
  // sobreviva a la navegación interna del ACUSE (mismo origen, misma pestaña).
  var CFG = {
    url: P.get('sb') || _s.url || '',
    key: P.get('key') || _s.key || '',
    user: P.get('user') || _s.user || lsUser() || 'Operador General'
  };
  try { sessionStorage.setItem('acuse.cfg', JSON.stringify(CFG)); } catch (_) {}

  var _clientPromise = null;
  function loadSupabase() {
    return new Promise(function (res, rej) {
      if (window.supabase && window.supabase.createClient) return res();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = res; s.onerror = function () { rej(new Error('No se pudo cargar supabase-js')); };
      document.head.appendChild(s);
    });
  }
  function sb() {
    if (_clientPromise) return _clientPromise;
    _clientPromise = (async function () {
      if (!CFG.url || !CFG.key) return null;
      await loadSupabase();
      return window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: false } });
    })();
    return _clientPromise;
  }

  /* ── Utilidades ─────────────────────────────────────────────────────────── */
  function httpError(status, message) { var e = new Error(message || ('Error HTTP ' + status)); e.status = status; return e; }
  function noConfig() { return httpError(503, 'Configurá el Supabase de Acuses (VITE_ACUSE_SUPABASE_*).'); }

  function normEstado(v) {
    var n = String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/_/g, ' ').toLowerCase().trim();
    if (['entregado', 'terminado', 'completado'].indexOf(n) >= 0) return 'Entregado';
    if (['en reparto', 'en transito', 'transito', 'reparto'].indexOf(n) >= 0) return 'En Reparto';
    if (['anulado', 'anulada', 'cancelado', 'cancelada'].indexOf(n) >= 0) return 'Anulado';
    return 'Pendiente';
  }
  function estadoUiKey(v) {
    var e = normEstado(v);
    if (e === 'Entregado') return 'entregado';
    if (e === 'En Reparto') return 'en_transito';
    if (e === 'Anulado') return 'anulado';
    return 'pendiente';
  }

  // Fila acuse (snake_case) → forma del contrato
  function headOut(r, det) {
    var items = det ? det.length : (r.__items || 0);
    var unidades = det ? det.reduce(function (a, d) { return a + (Number(d.cantidad || d.Cantidad) || 0); }, 0) : (r.__unid || 0);
    var estado = Number(r.activo) === 0 ? 'Anulado' : r.estado;
    return {
      ID_Acuse: r.id, Nro_Acuse: r.nro_acuse, Cod_Cliente: r.cod_cliente,
      Estado: estado, Fecha_Creacion: r.created_at, Fecha_Emision: r.fecha_emision, Fecha_Entrega: r.fecha_entrega,
      ID_Repartidor: r.repartidor_id, Codigo_Repartidor: r.repartidor_codigo || null, Nombre_Repartidor: r.repartidor_nombre,
      Estado_Repartidor: null,
      Observacion: r.observacion, Usuario_Creacion: r.usuario, Zona: r.zona, Activo: Number(r.activo ? 1 : 0),
      Nom_Cliente: r.cliente_nombre, Ruc_Cliente: r.cliente_ruc, Direc_Cliente: r.cliente_direccion,
      Ciudad_Cliente: r.cliente_ciudad, Zona_Cliente: r.zona, Telefono_Cliente: r.cliente_telefono,
      Canal_Distri: null, Cod_Vendedor: null, Cond_Venta: null, Vend_Asignado: null, Vend_Interno: null,
      Detalle_Items: items, Detalle_Cantidad_Total: unidades
    };
  }
  function detOut(d) {
    return { ID_Detalle: d.id, ID_Acuse: d.acuse_id, Cod_Mercaderia: d.cod_mercaderia, Cantidad: Number(d.cantidad), UM: d.um, Nota: d.nota, Descr_SAP: d.descripcion, Status_SAP: null, Jerarquia_SAP: null };
  }

  /* ── getAcuse completo ──────────────────────────────────────────────────── */
  async function getAcuseFull(client, id) {
    var r = await client.from('acuses').select('*').eq('id', id).single();
    if (r.error || !r.data) throw httpError(404, 'Acuse no encontrado');
    var det = await client.from('acuse_detalle').select('*').eq('acuse_id', id).order('id');
    var hist = await client.from('acuse_historial').select('*').eq('acuse_id', id).order('created_at', { ascending: false });
    var log = await client.from('acuse_log').select('*').eq('acuse_id', id).order('created_at', { ascending: false });
    var out = headOut(r.data, det.data || []);
    out.detalles = (det.data || []).map(detOut);
    out.historial = (hist.data || []).map(function (h) { return { ID: h.id, ID_Acuse: h.acuse_id, Estado: h.estado, Fecha: h.created_at, Usuario: h.usuario, Observacion: h.observacion }; });
    out.acciones = (log.data || []).map(function (l) { return { ID: l.id, ID_Acuse: l.acuse_id, Accion: l.accion, FechaHora: l.created_at, Usuario: l.usuario, Observacion: l.observacion }; });
    return out;
  }

  async function snapshotCliente(client, cod) {
    if (!cod) return {};
    var r = await client.from('clientes').select('*').eq('cod_cliente', cod).single();
    var c = r.data || {};
    return {
      cliente_nombre: c.nombre || null, cliente_ruc: c.ruc || null, cliente_direccion: c.direccion || null,
      cliente_ciudad: c.ciudad || null, cliente_telefono: c.telefono || null, zona_cli: c.zona || null
    };
  }
  async function repNombre(client, id) {
    if (!id) return null;
    var r = await client.from('repartidores').select('nombre,codigo').eq('id', id).single();
    return r.data || null;
  }

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  async function listAcuses(client, q) {
    var page = client.from('acuses').select('*,acuse_detalle(cantidad)', { count: 'exact' });
    var base = function (qq) {
      var estado = String(q.estado || '').trim();
      if (estado && estado !== 'all') {
        var e = normEstado(estado);
        if (e === 'Anulado') qq = qq.eq('estado', 'Anulado');
        else qq = qq.eq('estado', e).eq('activo', true);
      } else { qq = qq.eq('activo', true); }
      if (q.codCliente) qq = qq.eq('cod_cliente', q.codCliente);
      if (q.idRepartidor || q.repartidor) qq = qq.eq('repartidor_id', q.idRepartidor || q.repartidor);
      if (q.zona) qq = qq.ilike('zona', '%' + q.zona + '%');
      if (q.fecha) qq = qq.eq('fecha_emision', q.fecha);
      if (q.fechaDesde) qq = qq.gte('fecha_emision', q.fechaDesde);
      if (q.fechaHasta) qq = qq.lte('fecha_emision', q.fechaHasta);
      if (q.q) qq = qq.or('nro_acuse.ilike.%' + q.q + '%,cod_cliente.ilike.%' + q.q + '%,cliente_nombre.ilike.%' + q.q + '%,repartidor_nombre.ilike.%' + q.q + '%');
      return qq;
    };
    var all = String(q.all || '').toLowerCase();
    var fetchAll = all === '1' || all === 'true' || all === 'all';
    var limit = fetchAll ? null : Math.min(parseInt(q.limit, 10) || 100, 500);
    var offset = fetchAll ? 0 : (parseInt(q.offset, 10) || 0);
    page = base(page).order('created_at', { ascending: false });
    if (!fetchAll) page = page.range(offset, offset + limit - 1);
    var res = await page;
    if (res.error) throw httpError(500, res.error.message);
    var items = (res.data || []).map(function (r) {
      var det = r.acuse_detalle || [];
      r.__items = det.length; r.__unid = det.reduce(function (a, d) { return a + (Number(d.cantidad) || 0); }, 0);
      return headOut(r, null);
    });
    // summary
    var summary = { pendiente: 0, en_transito: 0, entregado: 0, anulado: 0 };
    var sumRes = await base(client.from('acuses').select('estado,activo')).limit(5000);
    (sumRes.data || []).forEach(function (r) { summary[Number(r.activo) === 0 ? 'anulado' : estadoUiKey(r.estado)] += 1; });
    return { items: items, total: res.count == null ? items.length : res.count, limit: fetchAll ? (res.count || items.length) : limit, offset: offset, summary: summary };
  }

  async function createAcuse(client, body) {
    var snap = await snapshotCliente(client, body.Cod_Cliente);
    var rep = await repNombre(client, body.ID_Repartidor);
    var ins = {
      cod_cliente: body.Cod_Cliente,
      cliente_nombre: snap.cliente_nombre, cliente_ruc: snap.cliente_ruc, cliente_direccion: snap.cliente_direccion,
      cliente_ciudad: snap.cliente_ciudad, cliente_telefono: snap.cliente_telefono,
      zona: body.Zona || snap.zona_cli || null,
      estado: normEstado(body.Estado), fecha_emision: body.Fecha_Emision, fecha_entrega: body.Fecha_Entrega || null,
      repartidor_id: body.ID_Repartidor || null, repartidor_nombre: rep ? rep.nombre : null,
      observacion: body.Observacion || null, usuario: body.Usuario || CFG.user, activo: true
    };
    var r = await client.from('acuses').insert(ins).select('id,nro_acuse').single();
    if (r.error) throw httpError(500, r.error.message);
    var id = r.data.id;
    var dets = (body.detalles || []).map(function (d) { return { acuse_id: id, cod_mercaderia: d.Cod_Mercaderia, descripcion: d.Descr_SAP || null, cantidad: Number(d.Cantidad), um: d.UM || null, nota: d.Nota || null }; });
    if (dets.length) await client.from('acuse_detalle').insert(dets);
    await client.from('acuse_historial').insert({ acuse_id: id, estado: ins.estado, usuario: ins.usuario, observacion: 'Creacion del acuse' });
    await client.from('acuse_log').insert({ acuse_id: id, accion: 'CREAR', usuario: ins.usuario, observacion: 'Acuse creado desde modulo web' });
    return getAcuseFull(client, id);
  }

  async function updateAcuse(client, id, body) {
    var snap = await snapshotCliente(client, body.Cod_Cliente);
    var rep = await repNombre(client, body.ID_Repartidor);
    var prev = await client.from('acuses').select('estado').eq('id', id).single();
    var upd = {
      cod_cliente: body.Cod_Cliente, cliente_nombre: snap.cliente_nombre, cliente_ruc: snap.cliente_ruc,
      cliente_direccion: snap.cliente_direccion, cliente_ciudad: snap.cliente_ciudad, cliente_telefono: snap.cliente_telefono,
      zona: body.Zona || snap.zona_cli || null, estado: normEstado(body.Estado),
      fecha_emision: body.Fecha_Emision, fecha_entrega: body.Fecha_Entrega || null,
      repartidor_id: body.ID_Repartidor || null, repartidor_nombre: rep ? rep.nombre : null,
      observacion: body.Observacion || null
    };
    var r = await client.from('acuses').update(upd).eq('id', id);
    if (r.error) throw httpError(500, r.error.message);
    await client.from('acuse_detalle').delete().eq('acuse_id', id);
    var dets = (body.detalles || []).map(function (d) { return { acuse_id: id, cod_mercaderia: d.Cod_Mercaderia, descripcion: d.Descr_SAP || null, cantidad: Number(d.Cantidad), um: d.UM || null, nota: d.Nota || null }; });
    if (dets.length) await client.from('acuse_detalle').insert(dets);
    if (!prev.data || prev.data.estado !== upd.estado) await client.from('acuse_historial').insert({ acuse_id: id, estado: upd.estado, usuario: body.Usuario || CFG.user, observacion: 'Cambio de estado desde edicion' });
    await client.from('acuse_log').insert({ acuse_id: id, accion: 'EDITAR', usuario: body.Usuario || CFG.user, observacion: 'Acuse actualizado desde modulo web' });
    return getAcuseFull(client, id);
  }

  async function changeEstado(client, id, body) {
    var estado = normEstado(body.Estado);
    var usuario = body.Usuario || CFG.user;
    var patch = { estado: estado };
    if (body.Fecha_Entrega) patch.fecha_entrega = body.Fecha_Entrega;
    var r = await client.from('acuses').update(patch).eq('id', id);
    if (r.error) throw httpError(500, r.error.message);
    await client.from('acuse_historial').insert({ acuse_id: id, estado: estado, usuario: usuario, observacion: body.Observacion || null });
    await client.from('acuse_log').insert({ acuse_id: id, accion: 'CAMBIO_ESTADO', usuario: usuario, observacion: body.Observacion || null });
    return getAcuseFull(client, id);
  }

  async function deactivate(client, id, body) {
    var usuario = (body && body.Usuario) || CFG.user;
    var obs = (body && body.Observacion) || 'Anulacion';
    var r = await client.from('acuses').update({ estado: 'Anulado', activo: false }).eq('id', id);
    if (r.error) throw httpError(500, r.error.message);
    await client.from('acuse_historial').insert({ acuse_id: id, estado: 'Anulado', usuario: usuario, observacion: obs });
    await client.from('acuse_log').insert({ acuse_id: id, accion: 'ANULAR', usuario: usuario, observacion: obs });
    return { ok: true, Estado: 'Anulado' };
  }

  async function dashboardResumen(client) {
    var hoy = new Date().toISOString().slice(0, 10);
    var all = await client.from('acuses').select('estado,activo,fecha_emision,fecha_entrega').eq('activo', true).limit(10000);
    var rows = all.data || [];
    var porEstadoMap = {};
    rows.forEach(function (r) { porEstadoMap[r.estado] = (porEstadoMap[r.estado] || 0) + 1; });
    var porEstado = Object.keys(porEstadoMap).map(function (k) { return { Estado: k, total: porEstadoMap[k] }; });
    var fechas = { hoy: 0, proximas: 0, entregadas: 0, total: rows.length };
    rows.forEach(function (r) {
      if (r.fecha_emision === hoy) fechas.hoy++;
      if (r.fecha_emision > hoy) fechas.proximas++;
      if (r.fecha_entrega) fechas.entregadas++;
    });
    var pendientes = rows.filter(function (r) { return estadoUiKey(r.estado) === 'pendiente'; }).length;
    var terminados = rows.filter(function (r) { return estadoUiKey(r.estado) === 'entregado'; }).length;
    var repC = await client.from('repartidores').select('*', { count: 'exact', head: true }).eq('activo', true);
    var porDiaMap = {};
    var d7 = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    rows.forEach(function (r) { if (r.fecha_emision >= d7) porDiaMap[r.fecha_emision] = (porDiaMap[r.fecha_emision] || 0) + 1; });
    var porDia = Object.keys(porDiaMap).sort().map(function (f) { return { fecha: f, total: porDiaMap[f] }; });
    return { porEstado: porEstado, fechas: fechas, resumen: { total: rows.length, pendientes: pendientes, entregados: terminados, terminados: terminados, repartidores: repC.count || 0 }, porDia: porDia };
  }

  async function auditoria(client, q) {
    var limit = Math.min(parseInt(q.limit, 10) || 200, 500);
    var log = await client.from('acuse_log').select('*,acuses(nro_acuse,cliente_nombre,cliente_ciudad,zona)').order('created_at', { ascending: false }).limit(limit);
    var items = (log.data || []).map(function (l) {
      var a = l.acuses || {};
      var tipo = ({ CREAR: 'Crear', EDITAR: 'Editar', ANULAR: 'Anular', IMPRIMIR: 'Impresion', CAMBIO_ESTADO: 'Cambio de estado' })[l.accion] || l.accion;
      return { Fecha: l.created_at, Usuario: l.usuario || 'Sistema', Accion: l.accion, Tipo: tipo, Observacion: l.observacion, ID_Acuse: l.acuse_id, Nro_Acuse: a.nro_acuse || (l.acuse_id ? 'ID-' + l.acuse_id : null), Cliente: a.cliente_nombre || null, Ciudad: a.cliente_ciudad || a.zona || null };
    });
    return { items: items, total: items.length, limit: limit, offset: 0 };
  }

  async function catRepartidores(client) {
    var r = await client.from('repartidores').select('id,codigo,nombre,activo').order('nombre');
    return { items: (r.data || []).map(function (x) { return { ID: x.id, Codigo_Repartidor: x.codigo, Nombre_Repartidor: x.nombre, Estado_Repartidor: x.activo ? 'Activo' : 'Inactivo' }; }) };
  }
  async function createRepartidor(client, body) {
    var nombre = (body.Nombre_Repartidor || body.nombre || '').trim();
    if (!nombre) throw httpError(400, 'Nombre del repartidor es obligatorio');
    var r = await client.from('repartidores').insert({ nombre: nombre, codigo: (body.Codigo_Repartidor || body.codigo || null), activo: true }).select('id,codigo,nombre,activo').single();
    if (r.error) throw httpError(500, r.error.message);
    var x = r.data;
    return { ID: x.id, Codigo_Repartidor: x.codigo, Nombre_Repartidor: x.nombre, Estado_Repartidor: 'Activo' };
  }
  async function catClientes(client, q) {
    var query = client.from('clientes').select('cod_cliente,nombre,ruc,direccion,ciudad,zona,telefono').order('nombre').limit(Math.min(parseInt(q.limit, 10) || 50, 200));
    var s = (q.q || q.search || '').trim();
    if (s) query = query.or('cod_cliente.ilike.%' + s + '%,nombre.ilike.%' + s + '%,ruc.ilike.%' + s + '%');
    var r = await query;
    return { items: (r.data || []).map(function (c) { return { Cod_Cliente: c.cod_cliente, Nom_Cliente: c.nombre, Ruc_Cliente: c.ruc, Direc_Cliente: c.direccion, Ciudad_Cliente: c.ciudad, Zona_Cliente: c.zona, Telefono_Cliente: c.telefono }; }) };
  }
  async function catArticulos(client, q) {
    var query = client.from('articulos').select('material,descripcion,um').order('descripcion').limit(Math.min(parseInt(q.limit, 10) || 50, 200));
    var s = (q.q || q.search || '').trim();
    if (s) query = query.or('material.ilike.%' + s + '%,descripcion.ilike.%' + s + '%');
    var r = await query;
    return { items: (r.data || []).map(function (a) { return { Material_SAP: a.material, Descr_SAP: a.descripcion, UM_SAP: a.um }; }) };
  }

  /* ── Router ─────────────────────────────────────────────────────────────── */
  async function route(method, rawPath, body) {
    var client = await sb();
    // separar query embebida en el path
    var qIndex = rawPath.indexOf('?');
    var path = qIndex >= 0 ? rawPath.slice(0, qIndex) : rawPath;
    var query = {};
    if (qIndex >= 0) new URLSearchParams(rawPath.slice(qIndex + 1)).forEach(function (v, k) { query[k] = v; });
    if (body && typeof body === 'object' && method === 'GET') query = Object.assign(query, body);

    if (path === '/api/health') return { ok: !!client };
    if (!client) throw noConfig();

    var seg = path.replace(/^\/api\//, '').split('/'); // e.g. ['acuses','12','estado']

    // catálogos
    if (path === '/api/repartidores' && method === 'GET') return catRepartidores(client);
    if (path === '/api/repartidores' && method === 'POST') return createRepartidor(client, body || {});
    if (path === '/api/repartidores/resumen') return { items: [] };
    if (path === '/api/clientes') return catClientes(client, query);
    if (path === '/api/articulos') return catArticulos(client, query);
    if (seg[0] === 'articulos' && (seg[2] === 'stock' || seg[2] === 'precios')) return { items: [] };

    // acuses
    if (path === '/api/acuses' && method === 'GET') return listAcuses(client, query);
    if (path === '/api/acuses' && method === 'POST') return createAcuse(client, body || {});
    if (seg[0] === 'acuses' && seg[1]) {
      var id = Number(seg[1]);
      if (seg[2] === 'estado' && method === 'PATCH') return changeEstado(client, id, body || {});
      if (!seg[2] && method === 'GET') return getAcuseFull(client, id);
      if (!seg[2] && method === 'PUT') return updateAcuse(client, id, body || {});
      if (!seg[2] && method === 'DELETE') return deactivate(client, id, body || {});
    }

    // dashboard
    if (path === '/api/dashboard/resumen') return dashboardResumen(client);
    if (path === '/api/auditoria') return auditoria(client, query);

    // dashboard interactivo (etapa 2) + print-log → stubs seguros
    if (path.indexOf('/api/dashboard/interactivo') === 0) {
      if (/\/print$/.test(path) && method === 'POST') {
        try { var pid = Number(seg[seg.length - 2]); if (pid) await client.from('acuse_log').insert({ acuse_id: pid, accion: 'IMPRIMIR', usuario: CFG.user, observacion: 'Impresion' }); } catch (_) {}
        return { ok: true };
      }
      if (/\/summary$/.test(path)) return { summary: {}, kpis: {}, cards: [] };
      if (/\/calendar$/.test(path)) return { items: [], dias: [] };
      return { items: [] };
    }

    throw httpError(404, 'Ruta no soportada por el adaptador: ' + method + ' ' + path);
  }

  window.AcuseAPI = {
    get: function (path, params) { return route('GET', path, params); },
    post: function (path, data) { return route('POST', path, data); },
    put: function (path, data) { return route('PUT', path, data); },
    patch: function (path, data) { return route('PATCH', path, data); },
    delete: function (path, data) { return route('DELETE', path, data || {}); },
    _config: CFG
  };
})();
