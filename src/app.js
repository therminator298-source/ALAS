// ============================================================
//  ALAS fabrica ? app.js
//
//  Secciones:
//    1. Configuraci\u00f3n de runtime (API, cache, sesiÃ¯Â¿Â½n)
//    2. Utilidades (helpers puros)
//    3. Estado global
//    4. Normalizaci\u00f3n y lookups de datos
//    5. C\u00e1lculos de tiempo
//    6. Autenticaci\u00f3n y sesi\u00f3n
//    7. Navegaci\u00f3n y vistas
//    8. Sistema de toasts
//    9. Renderizado ? Calendario
//   10. Renderizado ? Panel de tareas (drawer)
//   11. Acciones de calendario y tareas
//   12. Modal de nueva/editar tarea
//   13. Resumen (Dashboard)
//   14. Gesti\u00f3n de usuarios
//   15. Cola offline y sincronizaci\u00f3n
//   16. Notificaciones
//   17. B\u00fasqueda global
//   18. FAB y boot
//   19. Shell Mobile
//
//  Constantes de datos (ACTIVITY_TYPES, STATUSES, MONTHS, etc.) ?  constants.js
// ============================================================

// ???? 1. CONFIGURACI?N DE RUNTIME ??????????????????????????????????????????????????????????
// Las constantes de datos (ACTIVITY_TYPES, STATUSES, etc.) est\u00e1n en constants.js

const APP_CONFIG = window.APP_CONFIG || {};
const CACHE_KEYS = { tasks: 'ALAS_TAREAS_CACHE_V4', users: 'ALAS_USERS_CACHE_V1' };
const SESSION_KEY  = 'ALAS_SESION_V3';
const APP_DATA_KEY = String(APP_CONFIG.gasAppKey || '').trim();
const API_BASE = String(APP_CONFIG.apiBase || '').trim();
// ???? 2. UTILIDADES ??????????????????????????????????????????????????????????????????????????????????????

const pad2      = n => String(n).padStart(2, '0');
const dateKey   = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const todayKey  = ()  => dateKey(new Date());
const timeStr   = (h, m) => `${pad2(h)}:${pad2(m)}`;

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function currentTaskDateTime() {
  const now = new Date();
  return {
    date: dateKey(now),
    time: timeStr(now.getHours(), now.getMinutes())
  };
}

function getDepartmentTaskDates(dep = App.department) {
  return [...new Set(
    App.tasks
      .filter(t => t.dep === dep && t.fecha)
      .map(t => t.fecha)
  )].sort();
}

function resolvePreferredSelectedDay(dep = App.department, preferredDay = App.selectedDay) {
  const dates = getDepartmentTaskDates(dep);
  if (!dates.length) return preferredDay || todayKey();
  if (preferredDay && dates.includes(preferredDay)) return preferredDay;
  const today = todayKey();
  if (dates.includes(today)) return today;
  return dates[dates.length - 1];
}

function ensureSelectedDayForDepartment(dep = App.department, preferredDay = App.selectedDay) {
  const nextDay = resolvePreferredSelectedDay(dep, preferredDay);
  if (!nextDay) return;
  App.selectedDay = nextDay;
  const [y, m] = String(nextDay).split('-').map(Number);
  if (Number.isFinite(y) && Number.isFinite(m)) {
    App.year = y;
    App.month = m - 1;
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean)
    .slice(0, 2).map(p => p[0]).join('').toUpperCase() || '--';
}

function colorFromId(id) {
  let hash = 0;
  String(id || '').split('').forEach(ch => { hash = ((hash << 5) - hash) + ch.charCodeAt(0); hash |= 0; });
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

let guardNoticeAt = 0;
let clientGuardsInstalled = false;
let loginUiEventsInstalled = false;
let loginViewportEventsInstalled = false;
const loginViewportQuery = window.matchMedia('(max-width: 768px)');

function showClientGuardNotice() {
  const now = Date.now();
  if (now - guardNoticeAt < 1600) return;
  guardNoticeAt = now;
  if (document.getElementById('toast')) toast('Acceso de inspeccion bloqueado');
}

function isInspectionShortcut(e) {
  const key = String(e.key || '').toLowerCase();
  const withCtrlOrMeta = e.ctrlKey || e.metaKey;
  if (key === 'f12') return true;
  if (withCtrlOrMeta && !e.shiftKey && key === 'u') return true;
  if (withCtrlOrMeta && e.shiftKey && ['i', 'j', 'c', 'k', 'e'].includes(key)) return true;
  if (e.metaKey && e.altKey && ['i', 'j', 'c', 'k', 'u', 'e'].includes(key)) return true;
  return false;
}

window.addEventListener('unhandledrejection', e => {
  const msg = e.reason?.message || '';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('AbortError')) {
    e.preventDefault();
    return;
  }
  console.warn('Unhandled rejection:', e.reason);
});

function confirmAction(message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-light-overlay';
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="modal-light-box" style="text-align:center;">
        <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.5;">${esc(message)}</p>
        <div class="modal-actions" style="justify-content:center;">
          <button class="btn-cancel" id="confirmCancel">${esc(cancelText)}</button>
          <button class="btn-danger" id="confirmOk" style="flex:1;">${esc(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirmCancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#confirmOk').onclick = () => { overlay.remove(); resolve(true); };
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

function installClientGuards() {
  if (clientGuardsInstalled) return;
  clientGuardsInstalled = true;

  document.addEventListener('contextmenu', e => {
    e.preventDefault();
    showClientGuardNotice();
  }, true);

  document.addEventListener('keydown', e => {
    if (!isInspectionShortcut(e)) return;
    e.preventDefault();
    e.stopPropagation();
    showClientGuardNotice();
  }, true);
}

// ???? 4. ESTADO GLOBAL ????????????????????????????????????????????????????????????????????????????????

function hideLoaderOverlay() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  // Fade in app layout al mismo tiempo que el loader se oculta
  document.querySelector('.app-container')?.classList.add('alas-ready');

  loader.style.opacity = '0';
  loader.style.pointerEvents = 'none';

  if (loader._hideTimer) clearTimeout(loader._hideTimer);
  loader._hideTimer = setTimeout(() => {
    if (loader.style.opacity === '0') {
      loader.classList.add('hidden');
      loader.style.setProperty('display', 'none', 'important');
    }
  }, 400);
}

const LOADER_TITLE_TEXT = 'Iniciando';

function setLoaderOverlayState(options = {}) {
  const titleEl = document.getElementById('loaderTitle');
  const detailEl = document.getElementById('loaderDetail');
  if (titleEl) {
    titleEl.textContent = options.title || LOADER_TITLE_TEXT;
  }
  if (detailEl) {
    detailEl.textContent = options.detail || '';
  }
}

function showLoaderOverlay(options = {}) {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.style.opacity = '1';
  loader.style.pointerEvents = 'auto';
  loader.classList.remove('hidden');
  loader.style.setProperty('display', 'flex', 'important');
  setLoaderOverlayState(options);
}

const App = {
  view:            'cal',
  mode:            'mes',
  year:            new Date().getFullYear(),
  month:           new Date().getMonth(),
  selectedDay:     todayKey(),
  expandedGroups:  new Set(['en_proceso', 'pendiente', 'terminado']),
  search:          '',
  tasks:           [],
  department:      'fabrica',
  lastDeleted:     null,
  lastSaved:       null,
  currentUser:     null,
  sessionToken:    '',
  usersLoadError:  '',
  userFilter:      'todos',
  typeFilter:      'todos',
  usersLoading:    false,
  loginBusy:       false,
  loginPinState:   'idle',
  reorderPickId:   null,
  editingTask:     null,   // tarea en edici\u00f3n (o null si es nueva)
  formData:        null,   // estado del formulario modal
  editingUserId:   null,   // usuario en edici\u00f3n
  tasksSignature:  '',
  delayHistoryByTask: {},
  delayHistoryTaskId: ''
};

let users = [];                   // lista de usuarios activos
let selectedLoginUserId = null;
let toastTimer;

// Flags para evitar requests concurrentes
let isLoadingTasks = false;
let isLoadingUsers = false;
let isSyncing      = false;   // true mientras hay un POST en vuelo
let syncDoneAt     = 0;       // timestamp del \u00faltimo sync completado
const SYNC_COOLDOWN = 1500;   // margen corto para no leer un GET antes de que se estabilice el POST
const TASKS_POLL_INTERVAL = 45000; // Refresco cada 45s para no saturar Google Sheets

function persistSession(userId, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: userId, token }));
}

function clearSession() {
  App.sessionToken = '';
  localStorage.removeItem(SESSION_KEY);
}

function isSessionError(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('sesion') || msg.includes('session') || msg.includes('autentic');
}

function handleSessionExpired(message = 'Tu sesiÃ¯Â¿Â½n venciÃ¯Â¿Â½. Inicia sesiÃ¯Â¿Â½n nuevamente.') {
  clearSession();
  if (App.currentUser) confirmLogout(true);
  showLoginError(message);
}

// ???? NORMALIZACI?N DE DATOS ??????????????????????????????????????????????????????????????????????

function normalizeRole(value) {
  const raw = String(value || 'operativo').trim().toLowerCase();
  return raw === 'admin' || raw === 'administrador' ? 'admin' : 'operativo';
}

function normalizeDepartment(value, role = 'operativo') {
  const raw = String(value || '').trim().toLowerCase();
  if (role === 'admin' || raw === 'admin' || raw === 'todos') return 'admin';
  return raw === 'deposito' ? 'deposito' : 'fabrica';
}

function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Operativo';
}

function toBool(value) {
  if (typeof value === 'boolean') return value;
  const raw = String(value || '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 's\u00ed' || raw === 's\u00ed' || raw === 'x';
}

function toInt(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : fallback;
}

function parseSheetDate(value) {
  if (!value) return '';
  const txt = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) return txt;
  if (txt.includes('T')) return txt.slice(0, 10);
  
  const parts = txt.split('/');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (y.length === 2) y = '20' + y;
    return `${y}-${m}-${d}`;
  }
  return txt;
}

function parseSheetTime(value) {
  if (!value) return '';
  const txt = String(value).trim();
  const isoMatch = txt.match(/T(\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];
  const timeMatch = txt.match(/^(\d{2}:\d{2})/);
  return timeMatch ? timeMatch[1] : txt;
}

function normalizeUserRecord(raw) {
  if (!raw) return null;
  const id = String(raw.id || '').trim();
  const nm = String(raw.nombre || raw.nm || raw.name || '').trim();
  if (!id || !nm) return null;
  const rol = normalizeRole(raw.rol || raw.role);
  const dep = normalizeDepartment(raw.dep, rol);
  return {
    id,
    nm,
    rl:     roleLabel(rol),
    dep,
    ini:    initials(nm),
    clr:    colorFromId(id),
    rol,
    activo: raw.activo === undefined ? true : toBool(raw.activo)
  };
}

function normalizeTaskRecord(raw) {
  if (!raw || !raw.id) return null;
  // El sheet puede tener columnas dep y prio intercambiadas en registros legacy
  let dep  = raw.dep;
  let prio = raw.prio;
  const maybeDep = String(prio || '').trim().toLowerCase();
  if ((dep === false || dep === true || dep == null || dep === '') &&
      (maybeDep === 'fabrica' || maybeDep === 'deposito')) {
    // swap: prio ten\u00eda el departamento y dep tenía el booleano
    [dep, prio] = [prio, dep];
  }
  return {
    ...raw,
    id:     String(raw.id).trim(),
    fecha:  parseSheetDate(raw.fecha) || todayKey(),
    tipo:   String(raw.tipo || '').trim(),
    obs:    String(raw.obs || '').trim(),
    hi:     parseSheetTime(raw.hi),
    hf:     parseSheetTime(raw.hf),
    estado: STATUSES[raw.estado] ? raw.estado : 'pendiente',
    asig:   raw.asig ? String(raw.asig).trim() : '',
    dep:    normalizeDepartment(dep, 'operativo'),
    prio:   toBool(prio),
    pOrder: raw.pOrder === '' || raw.pOrder == null || Number.isNaN(Number(raw.pOrder)) ? null : Number(raw.pOrder),
    fCrea:     raw.fCrea     ? String(raw.fCrea)     : '',
    fIni:      raw.fIni      ? String(raw.fIni)      : '',
    fFin:      raw.fFin      ? String(raw.fFin)      : '',
    creadoPor: raw.creadoPor ? String(raw.creadoPor) : '',
    retraso:   raw.retraso   ? String(raw.retraso).trim() : '',
    delayCount:        toInt(raw.delayCount, 0),
    delayTotalMinutes: toInt(raw.delayTotalMinutes, 0),
    delayActive:       toBool(raw.delayActive),
    delayCurrentId:    raw.delayCurrentId ? String(raw.delayCurrentId).trim() : '',
    delayCurrentStart: raw.delayCurrentStart ? String(raw.delayCurrentStart) : ''
  };
}

function serializeTask(task) {
  return {
    id:        task.id,
    fecha:     task.fecha     || '',
    tipo:      task.tipo      || '',
    obs:       task.obs       || '',
    hi:        task.hi        || '',
    hf:        task.hf        || '',
    estado:    task.estado    || 'pendiente',
    asig:      task.asig      || '',
    dep:       normalizeDepartment(task.dep, 'operativo'),
    prio:      !!task.prio,
    pOrder:    task.pOrder == null ? '' : task.pOrder,
    fCrea:     task.fCrea     || '',
    fIni:      task.fIni      || '',
    fFin:      task.fFin      || '',
    creadoPor: task.creadoPor || '',
    retraso:   task.retraso   || ''
  };
}

function buildTaskStateSignature(task) {
  if (!task) return '';
  return [
    task.id,
    task.fecha,
    task.tipo,
    task.obs,
    task.hi,
    task.hf,
    task.estado,
    task.asig,
    task.dep,
    task.prio ? '1' : '0',
    task.pOrder == null ? '' : task.pOrder,
    task.fCrea,
    task.fIni,
    task.fFin,
    task.creadoPor,
    task.retraso,
    toInt(task.delayCount, 0),
    toInt(task.delayTotalMinutes, 0),
    task.delayActive ? '1' : '0',
    task.delayCurrentId || '',
    task.delayCurrentStart || ''
  ].join('\u001f');
}

function buildTaskListSignature(list) {
  return Array.isArray(list) ? list.map(buildTaskStateSignature).join('\u001e') : '';
}

function syncTaskSignature() {
  App.tasksSignature = buildTaskListSignature(App.tasks);
  return App.tasksSignature;
}

function replaceTaskFromServer(serverTask) {
  const normalized = normalizeTaskRecord(serverTask);
  if (!normalized) return null;

  const idx = App.tasks.findIndex(t => t.id === normalized.id);
  if (idx >= 0) {
    App.tasks[idx] = { ...App.tasks[idx], ...normalized };
    return App.tasks[idx];
  }

  App.tasks.push(normalized);
  return normalized;
}

function compareEnProcesoOrder(a, b) {
  const pa = (a?.pOrder != null && a.pOrder !== '') ? Number(a.pOrder) : 9999;
  const pb = (b?.pOrder != null && b.pOrder !== '') ? Number(b.pOrder) : 9999;
  if (pa !== pb) return pa - pb;
  if (a?.fIni && b?.fIni) return new Date(a.fIni) - new Date(b.fIni);
  return (a?.hi || '').localeCompare(b?.hi || '');
}

function getNextEnProcesoOrder(task) {
  const related = App.tasks
    .filter(t =>
      t.id !== task.id &&
      t.fecha === task.fecha &&
      t.dep === task.dep &&
      t.estado === 'en_proceso'
    )
    .slice()
    .sort(compareEnProcesoOrder);

  const numericOrders = related
    .map(t => Number(t.pOrder))
    .filter(n => Number.isFinite(n));

  return numericOrders.length ? Math.max(...numericOrders) + 1 : related.length;
}

function getEnProcesoOrderIdsForTask(task) {
  return App.tasks
    .filter(t =>
      t.fecha === task.fecha &&
      t.dep === task.dep &&
      t.estado === 'en_proceso'
    )
    .slice()
    .sort(compareEnProcesoOrder)
    .map(t => t.id);
}

function applyEnProcesoOrderIds(ids) {
  const changedIds = [];
  ids.forEach((id, i) => {
    const task = App.tasks.find(t => t.id === id);
    if (!task) return;
    const currentOrder = Number.isFinite(Number(task.pOrder)) ? Number(task.pOrder) : null;
    if (currentOrder !== i) changedIds.push(id);
    task.pOrder = i;
  });
  return changedIds;
}

function setTaskEnProcesoOrder(taskId, rawPosition) {
  const task = App.tasks.find(t => t.id === taskId);
  const requestedPosition = Number(rawPosition);
  if (!task || task.estado !== 'en_proceso' || !Number.isFinite(requestedPosition)) return null;

  const ids = getEnProcesoOrderIdsForTask(task);
  const fromIdx = ids.indexOf(taskId);
  if (fromIdx < 0) return null;

  const targetIdx = Math.max(0, Math.min(Math.trunc(requestedPosition) - 1, ids.length - 1));
  if (fromIdx !== targetIdx) {
    ids.splice(fromIdx, 1);
    ids.splice(targetIdx, 0, taskId);
    const changedIds = applyEnProcesoOrderIds(ids);
    saveTasksToCache();
    if (changedIds.length) persistEnProcesoOrder(changedIds);
  }

  return ids.indexOf(taskId) + 1;
}

async function persistEnProcesoOrder(ids) {
  const tasks = ids.map(id => App.tasks.find(t => t.id === id)).filter(Boolean);
  if (!tasks.length) return;
  try {
    await Promise.all(tasks.map(t => syncTask(t, 'save_task')));
  } catch (e) {
    console.error('No se pudo sincronizar el orden', e);
    toast('Orden guardado localmente');
  }
}

// ???? HELPERS DE LOOKUPS ????????????????????????????????????????????????????????????????????????????????

function activeUsers()        { return users.filter(u => u.activo); }
function findUser(id)         { return users.find(u => u.id === id) || null; }
function findActivityType(id) { return ACTIVITY_TYPES.find(t => t.id === id) || { nm: id, c: '#64748B', i: '?' }; }
function buildApiUrl(resource, extraParams = null) {
  const params = new URLSearchParams();
  params.set('resource', resource);
  if (APP_DATA_KEY) params.set('_key', APP_DATA_KEY);
  if (extraParams && typeof extraParams === 'object') {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value == null || value === '') return;
      params.set(key, String(value));
    });
  }
  const sep = API_BASE.includes('?') ? '&' : '?';
  return `${API_BASE}${sep}${params.toString()}`;
}

// ???? C\u00c1LCULOS DE TIEMPO ????????????????????????????????????????????????????????????????????????????????

function actualStart(task) {
  if (task.fIni) { const d = new Date(task.fIni); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
  return task.hi;
}

function formatActionError(error, fallback = 'No se pudo completar la accion') {
  const msg = String(error?.message || '').trim();
  if (!msg) return fallback;

  const raw = msg.toLowerCase();
  if (raw.includes('http 404') || raw === '404') {
    return 'La publicacion web no encontro el endpoint de guardado. El cambio quedo pendiente de sincronizaci\u00f3n con Google Sheets.';
  }
  if (raw.includes('sesion') || raw.includes('session') || raw.includes('autentic')) {
    return 'Tu sesiÃ¯Â¿Â½n venciÃ¯Â¿Â½. Inicia sesiÃ¯Â¿Â½n nuevamente.';
  }
  if (
    raw.includes('failed to fetch') ||
    raw.includes('load failed') ||
    raw.includes('networkerror') ||
    raw.includes('google sheets') ||
    raw.includes('no se pudo comunicar') ||
    raw.includes('timeout')
  ) {
    return 'No se pudo confirmar la sincronizaci\u00f3n con Google Sheets. El cambio quedo pendiente y se reintentara.';
  }
  return msg;
}

function calcDuration(hi, hf) {
  if (!hi || !hf) return null;
  const [h1, m1] = hi.split(':').map(Number);
  const [h2, m2] = hf.split(':').map(Number);
  if ([h1, m1, h2, m2].some(isNaN)) return null;
  let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diff < 0) diff += 1440;
  const h = Math.floor(diff / 60), m = diff % 60;
  return { h, m, total: diff, txt: h > 0 ? `${h}h ${m}m` : `${m}m` };
}

function liveElapsed(fIni, hi) {
  let diffSec;
  if (fIni) {
    diffSec = Math.floor((Date.now() - new Date(fIni).getTime()) / 1000);
  } else if (hi) {
    const [h1, m1] = hi.split(':').map(Number);
    const n = new Date();
    diffSec = ((n.getHours() * 60 + n.getMinutes()) - (h1 * 60 + m1)) * 60 + n.getSeconds();
  } else {
    return '';
  }
  if (diffSec < 0) diffSec = 0;
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}h ${m}m ${ss}s`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${s}s`;
}

function elapsedMinutesSince(value) {
  if (!value) return 0;
  const startedAt = new Date(value);
  if (Number.isNaN(startedAt.getTime())) return 0;
  const diff = Math.round((Date.now() - startedAt.getTime()) / 60000);
  if (diff <= 0 && Date.now() > startedAt.getTime()) return 1;
  return Math.max(0, diff);
}

function formatMinutesCompact(totalMinutes) {
  const total = toInt(totalMinutes, 0);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

function formatDelayStartedAt(value) {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}

function getTaskDelayMeta(task) {
  const count = toInt(task?.delayCount, 0);
  const totalMinutes = toInt(task?.delayTotalMinutes, 0);
  const active = !!task?.delayActive;
  const currentReason = String(task?.retraso || '').trim();
  const currentStart = String(task?.delayCurrentStart || '').trim();
  const totalWithActive = active ? totalMinutes + elapsedMinutesSince(currentStart) : totalMinutes;

  let badgeText = '';
  if (active && currentReason) {
    badgeText = `Demora activa: ${currentReason}`;
  } else if (active) {
    badgeText = 'Demora activa';
  } else if (count > 0) {
    badgeText = `${count} ${count === 1 ? 'demora' : 'demoras'} - ${formatMinutesCompact(totalMinutes)}`;
  } else if (currentReason) {
    badgeText = currentReason;
  }

  return {
    count,
    totalMinutes,
    totalWithActive,
    active,
    currentReason,
    currentStart,
    currentStartLabel: formatDelayStartedAt(currentStart),
    badgeText
  };
}

function normalizeDelayRecord(raw) {
  if (!raw) return null;
  const id = String(raw.id || '').trim();
  if (!id) return null;
  return {
    id,
    taskId: String(raw.taskId || '').trim(),
    motivo: String(raw.motivo || raw.retraso || '').trim(),
    inicio: raw.inicio ? String(raw.inicio) : '',
    fin: raw.fin ? String(raw.fin) : '',
    minutos: raw.minutos === '' || raw.minutos == null ? 0 : toInt(raw.minutos, 0),
    abiertaPor: String(raw.abiertaPor || '').trim(),
    cerradaPor: String(raw.cerradaPor || '').trim(),
    estado: String(raw.estado || '').trim().toLowerCase() === 'cerrada' ? 'cerrada' : 'activa'
  };
}

function formatDelayDateTime(value) {
  if (!value) return '--';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString('es-PY', {
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderDelayHistoryModal(task, options = {}) {
  const listEl = document.getElementById('mobDelayHistoryList');
  const titleEl = document.getElementById('mobDelayHistoryTitle');
  const metaEl = document.getElementById('mobDelayHistoryMeta');
  if (!listEl || !titleEl || !metaEl) return;

  const delayMeta = getTaskDelayMeta(task);
  const items = Array.isArray(options.items) ? options.items : [];
  const loading = !!options.loading;
  const error = String(options.error || '').trim();

  titleEl.textContent = `Demoras - ${findActivityType(task.tipo).nm}`;
  metaEl.textContent = delayMeta.count
    ? `${delayMeta.count} ${delayMeta.count === 1 ? 'registro' : 'registros'} - ${formatMinutesCompact(delayMeta.totalWithActive)} acumulados`
    : 'Sin demoras registradas';

  if (loading) {
    listEl.innerHTML = `<div class="mob-delay-history-empty">Cargando historial...</div>`;
    return;
  }

  if (error) {
    listEl.innerHTML = `<div class="mob-delay-history-empty">${esc(error)}</div>`;
    return;
  }

  if (!items.length) {
    listEl.innerHTML = `<div class="mob-delay-history-empty">No hay demoras registradas para esta tarea.</div>`;
    return;
  }

  listEl.innerHTML = items.map(delay => {
    const active = delay.estado === 'activa';
    const durationText = active
      ? `${formatMinutesCompact(elapsedMinutesSince(delay.inicio))} en curso`
      : formatMinutesCompact(delay.minutos);
    return `
      <div class="mob-delay-history-item">
        <div class="mob-delay-history-top">
          <div class="mob-delay-history-reason">${esc(delay.motivo || 'Sin motivo')}</div>
          <span class="mob-delay-history-badge ${active ? 'active' : 'done'}">${active ? 'Activa' : durationText}</span>
        </div>
        <div class="mob-delay-history-grid">
          <div>
            <div class="mob-delay-history-field-label">Inicio</div>
            <div class="mob-delay-history-field-value">${esc(formatDelayDateTime(delay.inicio))}</div>
          </div>
          <div>
            <div class="mob-delay-history-field-label">Fin</div>
            <div class="mob-delay-history-field-value">${esc(active ? '--' : formatDelayDateTime(delay.fin))}</div>
          </div>
          <div>
            <div class="mob-delay-history-field-label">Abierta por</div>
            <div class="mob-delay-history-field-value">${esc(delay.abiertaPor || '--')}</div>
          </div>
          <div>
            <div class="mob-delay-history-field-label">Cerrada por</div>
            <div class="mob-delay-history-field-value">${esc(active ? '--' : (delay.cerradaPor || '--'))}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function fetchTaskDelayHistory(taskId, forceFresh = false) {
  if (!taskId) return [];
  if (!forceFresh && Array.isArray(App.delayHistoryByTask[taskId])) {
    return App.delayHistoryByTask[taskId];
  }
  if (!API_BASE) throw new Error('No hay un endpoint configurado para Google Sheets');

  const url = buildApiUrl('demoras', {
    taskId,
    _uid: App.currentUser?.id || '',
    _token: App.sessionToken || '',
    _ts: forceFresh ? Date.now() : ''
  });

  const res = await fetchWithTimeout(url, {
    cache: forceFresh ? 'no-store' : 'default'
  }, 25000);

  const text = await res.text();
  let data = [];
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    throw new Error('El historial de demoras devolvio un formato invalido');
  }

  if (!res.ok) throw new Error((data && data.message) || `HTTP ${res.status}`);
  if (data && data.status === 'error') throw new Error(data.message || 'No se pudo cargar el historial');
  if (!Array.isArray(data)) throw new Error('El historial de demoras no devolvio una lista valida');

  const parsed = data.map(normalizeDelayRecord).filter(Boolean);
  App.delayHistoryByTask[taskId] = parsed;
  return parsed;
}

async function openDelayHistory(taskId, forceFresh = false) {
  const task = App.tasks.find(t => t.id === taskId);
  if (!task) return;

  App.delayHistoryTaskId = taskId;
  document.getElementById('mobDelayHistoryOverlay')?.classList.add('open');
  document.getElementById('mobDelayHistorySheet')?.classList.add('open');
  renderDelayHistoryModal(task, { loading: true });

  try {
    const items = await fetchTaskDelayHistory(taskId, forceFresh);
    renderDelayHistoryModal(task, { items });
  } catch (error) {
    if (isSessionError(error)) {
      handleSessionExpired(error.message);
      closeDelayHistory();
      return;
    }
    renderDelayHistoryModal(task, { error: getDataSourceErrorMessage(error, 'No se pudo cargar el historial') });
  }
}

function closeDelayHistory() {
  document.getElementById('mobDelayHistoryOverlay')?.classList.remove('open');
  document.getElementById('mobDelayHistorySheet')?.classList.remove('open');
  App.delayHistoryTaskId = '';
}

function formatDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return `${DAYS[new Date(y, m - 1, d).getDay()]} ${d} de ${MONTHS[m - 1]}`;
}

function gauge(pct, color, icon, size = 48) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, off = circ - (pct / 100) * circ;
  return `<div class="kpi-gauge" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="kpi-gauge-bg" cx="${size/2}" cy="${size/2}" r="${r}"/><circle class="kpi-gauge-fill" cx="${size/2}" cy="${size/2}" r="${r}" stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${off}" style="--circ:${circ};--off:${off}"/></svg><div class="kpi-gauge-ico">${icon}</div></div>`;
}

// ???? 5. AUTENTICACI?N Y SESI?N ??????????????????????????????????????????????????????????????

function showLoginError(message = '') {
  const el = document.getElementById('loginError');
  if (!el) return;
  const msg = String(message || '').trim();
  el.style.display = msg ? 'block' : 'none';
  el.textContent = msg;
}

function setLoginBusy(isBusy) {
  App.loginBusy = !!isBusy;
  const btn   = document.getElementById('loginSubmitBtn');
  const label = document.getElementById('loginSubmitLabel');
  if (!btn) return;
  btn.classList.toggle('is-loading', !!isBusy);
  btn.disabled = !!isBusy;
  btn.setAttribute('aria-busy', isBusy ? 'true' : 'false');
  if (label) label.textContent = isBusy ? 'Ingresando...' : 'Ingresar';
}

function setLoginPinStatus(state = 'idle', message = '') {
  App.loginPinState = state;
  const el = document.getElementById('loginPinStatus');
  if (!el) return;
  el.className = 'login-pin-status';
  el.innerHTML = '';
  if (state === 'idle' || !message) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.classList.add(`is-${state}`);
  if (state === 'loading') {
    el.innerHTML = `<span class="login-inline-spinner" aria-hidden="true"></span><span>${esc(message)}</span>`;
  } else {
    el.textContent = message;
  }
}

function clearLoginPinFeedback() {
  showLoginError('');
  setLoginPinStatus('idle', '');
}

function loginUserPlaceholderText() {
  if (App.usersLoading && !users.length) return 'Cargando usuarios...';
  if (activeUsers().length) return 'Seleccionar identidad...';
  if (App.usersLoadError && !users.length) return App.usersLoadError;
  return 'No hay usuarios activos';
}

function loginUserAvatarMarkup(user = null) {
  if (!user) {
    return `<span class="login-user-avatar login-user-avatar-inline is-placeholder"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>`;
  }
  return `<span class="login-user-avatar login-user-avatar-inline" style="background:${user.clr};">${user.ini}</span>`;
}

function isMobileLoginViewport() {
  return loginViewportQuery.matches;
}

function loginUserMetaText(user) {
  const depLabel = user.dep === 'deposito' ? 'deposito' : user.dep === 'fabrica' ? 'F\u00e1brica' : 'Todos';
  return user.rol === 'admin' ? user.rl : `${user.rl} - ${depLabel}`;
}

function renderLoginNativeUsers() {
  const native = document.getElementById('loginUserNative');
  if (!native) return;

  const loginUsers = getSortedLoginUsers();
  const placeholder = loginUserPlaceholderText();

  native.replaceChildren();

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  native.appendChild(placeholderOption);

  loginUsers.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.nm} - ${loginUserMetaText(user)}`;
    native.appendChild(option);
  });

  native.value = selectedLoginUserId || '';
  if (native.value !== (selectedLoginUserId || '')) native.value = '';
}

function setLoginSelectOpen(isOpen) {
  const dd = document.getElementById('loginUserDropdown');
  const display = document.getElementById('loginUserDisplay');
  const open = !!isOpen && !isMobileLoginViewport();
  if (dd) {
    dd.style.display = open ? 'flex' : 'none';
    dd.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  if (display) {
    display.classList.toggle('is-open', open);
    display.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
}

function currentLoginUser() {
  return activeUsers().find(u => u.id === selectedLoginUserId) || null;
}

function resetLoginForm() {
  selectedLoginUserId = null;
  const textEl      = document.getElementById('loginUserSelectedText');
  const avatarSlot  = document.getElementById('loginUserAvatarSlot');
  const native      = document.getElementById('loginUserNative');
  const pinInput    = document.getElementById('loginPin');
  const pinContainer= document.getElementById('loginPinContainer');
  const display     = document.getElementById('loginUserDisplay');
  const search      = document.getElementById('loginUserSearch');
  if (textEl)       textEl.textContent = loginUserPlaceholderText();
  if (avatarSlot)   avatarSlot.innerHTML = loginUserAvatarMarkup();
  if (native)       native.value = '';
  if (pinInput)     pinInput.value = '';
  if (pinContainer) pinContainer.style.display = 'none';
  if (display)      display.classList.remove('is-filled');
  setLoginSelectOpen(false);
  if (search)       search.value = '';
  setLoginBusy(false);
  clearLoginPinFeedback();
  showLoginError('');
}

function getSortedLoginUsers() {
  return activeUsers().sort((a, b) => {
    if (a.rol !== b.rol) return a.rol === 'admin' ? -1 : 1;
    return a.nm.localeCompare(b.nm, 'es', { sensitivity: 'base' });
  });
}

function renderLoginUsers(query = '') {
  const list = document.getElementById('loginUserList');
  if (!list) return;

  if (App.usersLoading && !users.length) {
    list.innerHTML = `<div class="login-user-empty"><span class="login-inline-spinner" aria-hidden="true"></span><span>Cargando usuarios...</span></div>`;
    return;
  }

  const q = String(query || '').trim().toLowerCase();
  const all = getSortedLoginUsers();
  const filtered = q ? all.filter(u => `${u.nm} ${u.rl} ${u.dep}`.toLowerCase().includes(q)) : all;

  if (!all.length) {
    list.innerHTML = `<div class="login-user-empty">${esc(App.usersLoadError || 'No hay usuarios activos disponibles.')}</div>`;
    return;
  }
  if (!filtered.length) {
    list.innerHTML = `<div class="login-user-empty">No hay coincidencias para tu b\u00fasqueda.</div>`;
    return;
  }

  list.innerHTML = filtered.map(u => {
    const selected = u.id === selectedLoginUserId ? ' is-selected' : '';
    const meta = loginUserMetaText(u);
    return `<button type="button" class="login-user-opt${selected}" data-login-user-id="${u.id}">
      <span class="login-user-opt-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"></path></svg>
      </span>
      <div class="login-user-avatar" style="background:${u.clr};">${u.ini}</div>
      <div class="login-user-copy">
        <span class="login-user-name">${esc(u.nm)}</span>
        <span class="login-user-meta">${esc(meta)}</span>
      </div>
    </button>`;
  }).join('');
}

function installLoginUiEvents() {
  if (loginUiEventsInstalled) return;

  const search = document.getElementById('loginUserSearch');
  const list = document.getElementById('loginUserList');
  const native = document.getElementById('loginUserNative');
  if (!search && !list && !native) return;

  loginUiEventsInstalled = true;

  native?.addEventListener('change', e => {
    selectLoginUser(e.target.value || '');
  });
  search?.addEventListener('input', filterLoginUsers);
  search?.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setLoginSelectOpen(false);
      document.getElementById('loginUserDisplay')?.focus();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const dd = document.getElementById('loginUserDropdown');
    const isOpen = !!dd && dd.style.display !== 'none' && dd.style.display !== '';
    if (!isOpen) return;
    setLoginSelectOpen(false);
    document.getElementById('loginUserDisplay')?.focus();
  });
  list?.addEventListener('click', e => {
    const option = e.target.closest('[data-login-user-id]');
    if (!option) return;
    e.preventDefault();
    selectLoginUser(option.getAttribute('data-login-user-id') || '');
  });

  if (loginViewportEventsInstalled) return;
  loginViewportEventsInstalled = true;

  const handleViewportChange = () => {
    setLoginSelectOpen(false);
    initLogin();
  };

  if (typeof loginViewportQuery.addEventListener === 'function') {
    loginViewportQuery.addEventListener('change', handleViewportChange);
  } else if (typeof loginViewportQuery.addListener === 'function') {
    loginViewportQuery.addListener(handleViewportChange);
  }
}

function initLogin() {
  installLoginUiEvents();
  const display   = document.getElementById('loginUserDisplay');
  const native    = document.getElementById('loginUserNative');
  const textEl    = document.getElementById('loginUserSelectedText');
  const avatarSlot= document.getElementById('loginUserAvatarSlot');
  const search    = document.getElementById('loginUserSearch');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const loginUsers = getSortedLoginUsers();
  const loading   = App.usersLoading && !users.length;
  const blocked   = loading || !loginUsers.length;

  if (display) display.classList.toggle('is-disabled', blocked);
  if (native)  native.disabled = blocked;
  if (search)  search.disabled = blocked;
  if (submitBtn && !App.loginBusy) submitBtn.disabled = blocked;
  if (textEl && !selectedLoginUserId) textEl.textContent = loginUserPlaceholderText();
  if (avatarSlot && !selectedLoginUserId) avatarSlot.innerHTML = loginUserAvatarMarkup();

  renderLoginNativeUsers();
  renderLoginUsers(search ? search.value : '');

  if (selectedLoginUserId && activeUsers().find(u => u.id === selectedLoginUserId)) {
    selectLoginUser(selectedLoginUserId, { keepPin: true, keepStatus: true, focusPin: false });
  } else if (!selectedLoginUserId) {
    setLoginBusy(false);
    clearLoginPinFeedback();
  } else {
    resetLoginForm();
  }
}

function toggleLoginSelect() {
  if ((App.usersLoading && !users.length) || !activeUsers().length) return;
  if (isMobileLoginViewport()) {
    document.getElementById('loginUserNative')?.focus();
    return;
  }
  const dd = document.getElementById('loginUserDropdown');
  if (!dd) return;
  const isOpen = dd.style.display !== 'none' && dd.style.display !== '';
  setLoginSelectOpen(!isOpen);
  if (!isOpen) {
    const search = document.getElementById('loginUserSearch');
    if (search) {
      search.focus();
      search.select();
    }
  }
}

const doFilterLoginUsers = debounce(() => {
  const search = document.getElementById('loginUserSearch');
  renderLoginUsers(search ? search.value : '');
}, 200);

function filterLoginUsers() {
  doFilterLoginUsers();
}

function selectLoginUser(id, opts = {}) {
  const { keepPin = false, keepStatus = false, focusPin = true } = opts;
  selectedLoginUserId = id || null;
  const user = currentLoginUser();
  if (!user) {
    const textEl = document.getElementById('loginUserSelectedText');
    const avatarSlot = document.getElementById('loginUserAvatarSlot');
    const native = document.getElementById('loginUserNative');
    const display = document.getElementById('loginUserDisplay');
    const pinContainer = document.getElementById('loginPinContainer');
    const pinInput = document.getElementById('loginPin');
    if (native) native.value = '';
    if (textEl) textEl.textContent = loginUserPlaceholderText();
    if (avatarSlot) avatarSlot.innerHTML = loginUserAvatarMarkup();
    if (display) display.classList.remove('is-filled');
    if (pinContainer) pinContainer.style.display = 'none';
    if (pinInput) pinInput.value = '';
    setLoginSelectOpen(false);
    renderLoginNativeUsers();
    renderLoginUsers(document.getElementById('loginUserSearch')?.value || '');
    clearLoginPinFeedback();
    showLoginError('');
    return;
  }

  const meta = loginUserMetaText(user);
  const textEl = document.getElementById('loginUserSelectedText');
  const avatarSlot = document.getElementById('loginUserAvatarSlot');
  const native = document.getElementById('loginUserNative');
  const display = document.getElementById('loginUserDisplay');
  if (textEl) {
    textEl.innerHTML = `<span class="login-selected-name">${esc(user.nm)}</span><span class="login-selected-meta">${esc(meta)}</span>`;
  }
  if (avatarSlot) avatarSlot.innerHTML = loginUserAvatarMarkup(user);
  if (native) native.value = user.id;
  if (display) display.classList.add('is-filled');
  setLoginSelectOpen(false);
  renderLoginNativeUsers();
  renderLoginUsers(document.getElementById('loginUserSearch')?.value || '');

  const pinContainer = document.getElementById('loginPinContainer');
  const pinInput     = document.getElementById('loginPin');

  if (user.rol === 'admin') {
    if (pinContainer) pinContainer.style.display = 'block';
    if (pinInput && !keepPin) pinInput.value = '';
    if (!keepStatus) setLoginPinStatus('neutral', 'Ingresa tu PIN de administrador');
    if (focusPin) pinInput?.focus();
  } else {
    if (pinContainer) pinContainer.style.display = 'none';
    if (pinInput) pinInput.value = '';
    setLoginPinStatus('idle', '');
  }
  showLoginError('');
}

document.addEventListener('click', e => {
  const container = document.getElementById('loginUserCustomContainer');
  if (container && !container.contains(e.target)) {
    setLoginSelectOpen(false);
  }
});

async function doLogin() {
  if (App.loginBusy) return;
  if (!selectedLoginUserId) { showLoginError('Selecciona un usuario'); return; }

  const pin          = document.getElementById('loginPin')?.value.trim() || '';
  const selectedUser = currentLoginUser();

  if (selectedUser && selectedUser.rol === 'admin' && !pin) {
    setLoginPinStatus('error', 'Ingresa tu PIN');
    showLoginError('');
    return;
  }

  let loginOk = false;
  try {
    setLoginBusy(true);
    if (selectedUser && selectedUser.rol === 'admin') setLoginPinStatus('loading', 'Verificando PIN...');
    const response = await postAction({ action: 'login', id: selectedLoginUserId, pin });
    const user = normalizeUserRecord(response.user);
    const token = String(response.token || '').trim();
    if (!user) throw new Error('No se pudo validar el usuario');
    if (!token) throw new Error('No se recibi\u00f3 un token de sesi\u00f3n v\u00e1lido');
    persistSession(user.id, token);
    showLoginError('');
    if (user.rol === 'admin') setLoginPinStatus('ok', 'PIN correcto');
    loginOk = true;
    await new Promise(r => setTimeout(r, 200));
    setLoggedInUser(user, token);
    showLoaderOverlay({
      title: 'Ingresando al panel operativo',
      detail: 'Sincronizando tareas y preparando tu jornada de trabajo...',
      loginState: 'done',
      loginText: 'Acceso validado',
      opsState: 'active',
      opsText: 'Cargando tablero y actividades'
    });
    const hadPendingQueue = hasPendingQueue();
    const flushedQueue = await processQueue({ silent: true, refreshAfter: true, refreshSilent: false });
    if (!hadPendingQueue || !flushedQueue) {
      await loadTaskData(false, hadPendingQueue ? false : true);
    }
  } catch (e) {
    hideLoaderOverlay();
    const msg = e.message || 'No se pudo iniciar sesi\u00f3n';
    if (selectedUser && selectedUser.rol === 'admin') {
      setLoginPinStatus('error', /pin/i.test(msg) ? 'PIN incorrecto' : 'No se pudo validar el PIN');
      showLoginError('');
    } else {
      showLoginError(msg);
    }
  } finally {
    if (!loginOk) setLoginBusy(false);
  }
}

function setLoggedInUser(user, token = App.sessionToken) {
  App.currentUser = user;
  App.sessionToken = token || '';
  const overlay = document.getElementById('loginOverlay');
  if (overlay) {
    overlay.classList.add('is-entering');
    setTimeout(() => { overlay.style.display = 'none'; overlay.classList.remove('is-entering'); }, 200);
  }
  updateSidebarUser();
  requestNotificationPermission();

  const bf  = document.getElementById('btnDepFabrica');
  const bd  = document.getElementById('btnDepDeposito');
  const adT = document.getElementById('navAdminTitle');
  const adU = document.getElementById('btnAdminUsuarios');

  if (user.rol === 'admin') {
    if (bf)  bf.style.display  = 'flex';
    if (bd)  bd.style.display  = 'flex';
    if (adT) adT.style.display = 'block';
    if (adU) adU.style.display = 'flex';
    setDepartment('fabrica');
  } else {
    if (bf)  bf.style.display  = user.dep === 'fabrica'  ? 'flex' : 'none';
    if (bd)  bd.style.display  = user.dep === 'deposito' ? 'flex' : 'none';
    if (adT) adT.style.display = 'none';
    if (adU) adU.style.display = 'none';
    setDepartment(user.dep);
  }
}

function updateSidebarUser() {
  const av = document.getElementById('sidebarAvatar');
  const nm = document.getElementById('sidebarUserName');
  const rl = document.getElementById('sidebarUserRole');
  const shieldSVG = `<svg class="shield-icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

  if (!App.currentUser) {
    if (av) { av.innerHTML = `--<div class="online-dot"></div>`; av.style.background = ''; }
    if (nm) nm.innerText = 'Usuario';
    if (rl) rl.innerHTML = `${shieldSVG} <span>Sin sesi\u00f3n</span>`;
    return;
  }
  if (av) { av.innerHTML = `${App.currentUser.ini}<div class="online-dot"></div>`; av.style.background = App.currentUser.clr; }
  if (nm) nm.innerText = App.currentUser.nm;
  if (rl) rl.innerHTML = `${shieldSVG} <span>${App.currentUser.rl}</span>`;
}

function restoreSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!saved || !saved.id || !saved.token) return;
    const user = activeUsers().find(u => u.id === saved.id);
    if (user) setLoggedInUser(user, saved.token);
    else clearSession();
  } catch (e) {
    clearSession();
  }
}

function logout() {
  document.getElementById('logoutModal').style.display = 'flex';
}

function confirmLogout(forceClose = false) {
  App.currentUser = null;
  App.sessionToken = '';
  App.tasks = [];
  invalidateCache(CACHE_KEYS.tasks);
  hideLoaderOverlay();
  clearSession();
  document.getElementById('logoutModal').style.display = 'none';
  const overlay = document.getElementById('loginOverlay');
  if (overlay) { overlay.classList.remove('is-entering'); overlay.style.display = 'flex'; }
  updateSidebarUser();
  resetLoginForm();
  if (!forceClose) setView('cal');
  render();
}

// ???? 6. NAVEGACI?N Y VISTAS ????????????????????????????????????????????????????????????????????

function setView(v) {
  const prevEl = document.getElementById('v-' + App.view);
  App.view = v;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.v === v));
  updateTopTitle();

  const nextEl = document.getElementById('v-' + v);
  if (nextEl && prevEl && prevEl !== nextEl) {
    // Exit: salida suave de la vista anterior
    prevEl.classList.add('dept-exiting');
    document.querySelectorAll('.vw').forEach(el => { if (el !== prevEl) el.classList.remove('on'); });
    setTimeout(() => prevEl.classList.remove('on', 'dept-exiting'), 150);

    // Enter: nueva vista entra tras el render
    nextEl.classList.add('on', 'dept-switching');
    requestAnimationFrame(() => {
      render();
      nextEl.classList.remove('dept-switching');
      nextEl.classList.add('dept-entering');
      setTimeout(() => nextEl.classList.remove('dept-entering'), 320);
    });
  } else {
    document.querySelectorAll('.vw').forEach(el => el.classList.remove('on'));
    nextEl?.classList.add('on');
    render();
  }
}

// Alias para compatibilidad con onclick en index.html
const go = setView;

function setDepartment(dep) {
  App.department  = dep;
  App.userFilter  = 'todos';
  App.typeFilter  = 'todos';
  const bf = document.getElementById('btnDepFabrica');
  const bd = document.getElementById('btnDepDeposito');
  if (bf) bf.classList.toggle('on', dep === 'fabrica');
  if (bd) bd.classList.toggle('on', dep === 'deposito');

  if (App.view === 'res' || App.view === 'usr') { setView('cal'); return; }

  updateTopTitle();

  const viewEl = document.getElementById('v-' + App.view);
  if (viewEl) {
    viewEl.classList.add('dept-switching');
    setTimeout(() => {
      ensureSelectedDayForDepartment(dep, null);
      render();
      viewEl.classList.remove('dept-switching');
      requestAnimationFrame(() => {
        viewEl.classList.add('dept-entering');
        setTimeout(() => viewEl.classList.remove('dept-entering'), 300);
      });
    }, 110);
  } else {
    ensureSelectedDayForDepartment(dep, null);
    render();
  }
}

// Alias usado desde index.html
const setDep = setDepartment;

function updateTopTitle() {
  const title = document.getElementById('topBrandTitle');
  if (!title) return;

  const calSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const resSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`;
  const usrSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;

  let icon      = calSVG;
  let text      = App.department === 'fabrica' ? 'F\u00e1brica' : 'Dep\u00f3sito';
  let badge     = 'Calendario';
  let iconCls   = 'is-' + (App.department === 'fabrica' ? 'fabrica' : 'deposito');
  let badgeCls  = iconCls;

  if (App.view === 'res') {
    icon = resSVG; text = 'Resumen'; badge = 'Datos'; iconCls = 'is-neutral'; badgeCls = 'is-neutral';
  }
  if (App.view === 'usr') {
    icon = usrSVG; text = 'Usuarios'; badge = 'Gesti\u00f3n'; iconCls = 'is-neutral'; badgeCls = 'is-neutral';
  }

  title.innerHTML = `<div class="page-title"><div class="page-title-icon ${iconCls}">${icon}</div><span class="page-title-text">${text}</span><span class="page-title-badge ${badgeCls}">${badge}</span></div>`;
}

function updateLastSyncStatus() {
  const el = document.getElementById('lastSyncStatus');
  if (!el) return;
  if (!syncDoneAt) { el.textContent = ''; return; }
  const diff = Date.now() - syncDoneAt;
  if (diff < 5000 || diff >= 3600000) { el.textContent = ''; return; }
  if (diff < 60000) { el.textContent = `Actualizado hace ${Math.round(diff / 1000)}s`; return; }
  el.textContent = `Actualizado hace ${Math.round(diff / 60000)}m`;
}

function syncTopbarKpis(kpis = []) {
  const host = document.getElementById('topKpiBar');
  const topbar = document.querySelector('.topbar');
  if (!host) return;

  if (App.view !== 'cal' || !Array.isArray(kpis) || !kpis.length) {
    host.innerHTML = '';
    host.classList.remove('has-kpis');
    topbar?.classList.remove('has-kpis');
    return;
  }

  host.innerHTML = `<div class="kpi-bar kpi-bar-inline">${kpis.map((k, i) => `
    <div class="kpi" style="animation-delay:${i * .05}s;">
      <div class="kpi-val" style="color:${k.c}">${k.v}</div>
      <div class="kpi-lbl">${k.l}</div>
      <div class="kpi-track"><div class="kpi-fill" style="background:${k.bc};width:${Math.max(k.pct, 3)}%"></div></div>
    </div>`).join('')}</div>`;

  host.classList.add('has-kpis');
  topbar?.classList.add('has-kpis');
}

// ???? 7. SISTEMA DE TOASTS ????????????????????????????????????????????????????????????????????????

function toast(msg, hasUndo) {
  const t = document.getElementById('toast');
  const raw = msg.replace(/<[^>]+>/g, '').toLowerCase();
  let type = 'info';
  if (raw.includes('guardad') || raw.includes('completad') || raw.includes('terminad') || raw.includes('guardada') || raw.includes('actualizada') || raw.includes('restaurada')) type = 'success';
  else if (raw.includes('iniciada')) type = 'started';
  else if (raw.includes('eliminad')) type = 'delete';
  else if (raw.includes('error') || raw.includes('no se pudo') || raw.includes('incorrecto') || raw.includes('revertido') || raw.includes('denegado')) type = 'error';
  else if (raw.includes('solo los') || raw.includes('permiso') || raw.includes('requerido') || raw.includes('anticipado')) type = 'warning';

  t.dataset.type = type;

  const icons = {
    success: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    started: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    delete:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`,
    error:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  t.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-body">
      <span class="toast-msg">${msg}</span>
      ${hasUndo ? `<button class="toast-undo" onclick="undoDelete()">Deshacer</button>` : ''}
    </div>
    <button class="toast-close" onclick="dismissToast()"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    <div class="toast-bar"></div>`;

  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  playNotifSound();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dismissToast(), 4000);
}

function dismissToast() {
  const t = document.getElementById('toast');
  t.classList.remove('show');
  App.lastDeleted = null;
}

// ???? RENDERIZADO PRINCIPAL ??????????????????????????????????????????????????????????????????????????

// ???? 8. RENDERIZADO ? CALENDARIO ??????????????????????????????????????????????????????????

function render() {
  if (App.view === 'cal') renderCalendar();
  else if (App.view === 'res') renderSummary();
  else if (App.view === 'usr') renderUsers();
  syncTaskSignature();
  if (App.lastSaved) setTimeout(() => { App.lastSaved = null; }, 2000);
}

let drawerRenderQueued = false;
function scheduleDrawerRender() {
  if (drawerRenderQueued) return;
  drawerRenderQueued = true;
  const flush = () => {
    drawerRenderQueued = false;
    renderDrawer();
  };
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(flush);
  } else {
    setTimeout(flush, 0);
  }
}

// ???? CALENDARIO ????????????????????????????????????????????????????????????????????????????????????????????????

function renderCalendar() {
  const v = document.getElementById('v-cal');
  if (!v) return;

  const today = todayKey();
  const firstDay = new Date(App.year, App.month, 1).getDay();
  const daysInMonth = new Date(App.year, App.month + 1, 0).getDate();

  const currentMonthPrefix = `${App.year}-${pad2(App.month + 1)}`;

  // Agrupar tareas por fecha para todo el dept (solo un filtrado)
  const tasksByDate = {};
  const deptTasks = [];
  App.tasks.forEach(t => {
    if (t.dep !== App.department) return;
    deptTasks.push(t);
    if (!tasksByDate[t.fecha]) tasksByDate[t.fecha] = [];
    tasksByDate[t.fecha].push(t);
  });
  const monthTasks = deptTasks.filter(t => t.fecha && t.fecha.startsWith(currentMonthPrefix));

  const pending    = monthTasks.filter(t => t.estado === 'pendiente').length;
  const inProgress = monthTasks.filter(t => t.estado === 'en_proceso').length;
  const done       = monthTasks.filter(t => t.estado === 'terminado').length;
  const efficiency = monthTasks.length ? Math.round(done / monthTasks.length * 100) : 0;

  const kColors = ['#0066CC','#F59E0B','#3B82F6','#10B981','#8B5CF6'];
  const kpis = [
    { v: monthTasks.length, l: 'TOTAL',       pct: Math.min(monthTasks.length / 120 * 100, 100), c: kColors[0], ico: 'T',  bc: '#0066CC' },
    { v: pending,           l: 'PENDIENTE',   pct: monthTasks.length ? pending / monthTasks.length * 100 : 0,    c: kColors[1], ico: 'P',  bc: '#F59E0B' },
    { v: inProgress,        l: 'EN PROCESO',  pct: monthTasks.length ? inProgress / monthTasks.length * 100 : 0, c: kColors[2], ico: '>',  bc: '#3B82F6' },
    { v: done,              l: 'COMPLETADO',  pct: monthTasks.length ? done / monthTasks.length * 100 : 0,       c: kColors[3], ico: 'OK', bc: '#10B981' },
    { v: efficiency + '%',  l: 'AVANCE',       pct: efficiency,                                                   c: kColors[4], ico: '%',  bc: '#8B5CF6' }
  ];

  syncTopbarKpis(kpis);
  const addSVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  let grid = '';
  DAYS.forEach(d => { grid += `<div class="c-hdr">${d}</div>`; });

  if (App.mode === 'semana') {
    const target = new Date(App.selectedDay || today);
    const weekStart = new Date(target);
    weekStart.setDate(target.getDate() - target.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = dateKey(d);
      grid += buildDayCell(key, today, tasksByDate[key] || [], true);
    }
  } else {
    for (let i = 0; i < firstDay; i++) grid += '<div class="c-day emp"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${App.year}-${pad2(App.month + 1)}-${pad2(day)}`;
      grid += buildDayCell(key, today, tasksByDate[key] || [], false);
    }
  }

  v.innerHTML = `<div class="cal-layout">
    <section class="cal">
      <header class="cal-nav">
        <div class="cal-nav-main">
          <div class="cal-nav-l">
            <button class="c-arr" onclick="changeMonth(-1)">&lsaquo;</button>
            <span class="c-mo">${MONTHS[App.month]} ${App.year}</span>
            <button class="c-arr" onclick="changeMonth(1)">&rsaquo;</button>
          </div>
          <div class="cal-nav-filters">
            <button class="cal-btn ${App.mode === 'mes' ? 'on' : ''}" onclick="App.mode='mes';render()">Mes</button>
            <button class="cal-btn ${App.mode === 'semana' ? 'on' : ''}" onclick="App.mode='semana';render()">Semana</button>
            <button class="cal-btn cal-btn-hoy" onclick="goToday()">Hoy</button>
          </div>
        </div>
        <button class="new-b" onclick="openModal()">${addSVG} Agregar Tarea</button>
      </header>
      <div class="c-grid${App.mode === 'semana' ? ' c-grid-week' : ''}">${grid}</div>
      <footer class="cal-leg">
        <div class="cl-i"><div class="cl-d" style="background:var(--status-pending)"></div>Pendiente</div>
        <div class="cl-i"><div class="cl-d" style="background:var(--brand-primary)"></div>En Proceso</div>
        <div class="cl-i"><div class="cl-d" style="background:var(--status-ok)"></div>Terminado</div>
      </footer>
    </section>
    <div id="rpContainer" style="display:flex;flex-direction:column;height:100%;overflow:hidden;"></div>
  </div>`;

  scheduleDrawerRender();
}

function buildDayCell(key, today, dayTasks, showMonth) {
  const isToday    = key === today;
  const isSelected = key === App.selectedDay;
  const allDone    = dayTasks.length > 0 && dayTasks.every(t => t.estado === 'terminado');
  const hasProgress= dayTasks.some(t => t.estado === 'en_proceso');

  let cls = 'c-day';
  if (isToday)    cls += ' hoy';
  if (isSelected) cls += ' sel';
  if (dayTasks.length) cls += allDone ? ' s-ok' : hasProgress ? ' s-pr' : ' s-pe';

  const [y, m, d] = key.split('-').map(Number);
  let extras = '';
  if (dayTasks.length) {
    extras += '<div class="cd-dots">';
    dayTasks.slice(0, 4).forEach(t => {
      extras += `<span class="cd-dot" style="background:${isToday ? 'rgba(255,255,255,.6)' : STATUSES[t.estado].c}"></span>`;
    });
    extras += '</div>';
    if (dayTasks.length > 1) extras += `<span class="cd-cnt">${dayTasks.length}</span>`;
  }

  const monthLabel = showMonth ? `<span class="dn-mo" style="font-size:10px;color:var(--text-muted);margin-top:-2px">${MONTHS[m - 1].substring(0, 3)}</span>` : '';
  return `<div class="${cls}" data-key="${key}"><button class="c-day-hit" type="button" aria-label="Abrir ${key}" onclick="selectDay('${key}')"></button><span class="dn">${d}</span>${monthLabel}${extras}</div>`;
}

// ???? 9. RENDERIZADO ? PANEL DE TAREAS (DRAWER) ??????????????????????????????

function renderDrawer() {
  const container = document.getElementById('rpContainer');
  if (!container) return;

  if (!App.selectedDay) {
    ensureSelectedDayForDepartment(App.department, null);
  }

  const sortFn = (a, b) => {
    if (a.prio && !b.prio) return -1;
    if (!a.prio && b.prio) return 1;
    if (a.fCrea && b.fCrea) return new Date(b.fCrea) - new Date(a.fCrea);
    return 0;
  };

  // Base: todas las del d\u00eda/depto (para construir los filtros)
  const allDayTasks = App.tasks
    .filter(t => t.fecha === App.selectedDay && t.dep === App.department)
    .sort(sortFn);

  // Aplicar filtro de usuario
  let dayTasks = App.userFilter === 'todos'
    ? allDayTasks
    : allDayTasks.filter(t => t.asig === App.userFilter);

  // Aplicar filtro de tipo
  if (App.typeFilter !== 'todos') {
    dayTasks = dayTasks.filter(t => t.tipo === App.typeFilter);
  }

  // Aplicar b\u00fasqueda de texto
  if (App.search) {
    const s = App.search.toLowerCase();
    dayTasks = dayTasks.filter(t =>
      t.obs.toLowerCase().includes(s) || findActivityType(t.tipo).nm.toLowerCase().includes(s)
    );
  }

  if (App.reorderPickId && !dayTasks.some(t => t.id === App.reorderPickId && t.estado === 'en_proceso')) {
    App.reorderPickId = null;
  }

  let sectionsHTML = '';

  ['en_proceso', 'pendiente', 'terminado'].forEach(status => {
    const statusCfg = STATUSES[status];
    let items = dayTasks.filter(t => t.estado === status);

    let cards, bodyId = '';
    if (status === 'en_proceso') {
      items = items.slice().sort(compareEnProcesoOrder);
      bodyId = ' id="enProcesoList"';
    } else {
      bodyId = ` id="${status}List"`;
    }
    cards = items.map((t, i) => buildUnifiedCard(t, status, i)).join('');
    const isOpen = App.expandedGroups.has(status);
    const chevron = `<svg class="sg-arr ${isOpen ? 'open' : ''}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const bodyContent = cards || `<div class="sg-empty-mini">Sin tareas en este estado</div>`;

    sectionsHTML += `
      <section class="sg" style="--sg-accent:${statusCfg.c};--sg-soft:${statusCfg.bg};--sg-text:${statusCfg.tc};">
        <button class="sg-hdr ${isOpen ? 'on' : ''}" type="button" onclick="toggleGroup('${status}')">
          <div class="sg-hdr-main">
            <span class="sg-nm">${statusCfg.nm}</span>
            <span class="sg-cnt">${items.length}</span>
          </div>
          <span class="sg-arr-wrap">${chevron}</span>
        </button>
        <div class="sg-body ${isOpen ? 'show' : ''}"${bodyId}>${bodyContent}</div>
      </section>`;
  });

  const groupsHTML = dayTasks.length
    ? `${sectionsHTML || `<div class="sg-empty-state">Todos los bloques estan ocultos. Usa los encabezados para volver a mostrarlos.</div>`}`
    : '';

  const emptyTasks = `<div class="empty" style="min-height:180px"><p class="empty-i">&#128203;</p><p class="empty-t">Sin tareas</p><p class="empty-s">Crea una desde Agregar Tarea en el calendario</p></div>`;

  container.innerHTML = `
    <aside class="rp" style="height:100%;">
      <header class="rp-hdr" style="flex-direction:row;padding:12px 16px;gap:12px;border-bottom:1px solid var(--border-light);">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">
          <h2 class="rp-ttl" style="margin:0;white-space:nowrap;">${formatDate(App.selectedDay)}</h2>
          <span class="rp-cnt">${dayTasks.length}</span>
          ${buildUserFilterDropdown(allDayTasks)}
          ${buildTypeFilterDropdown(allDayTasks)}
        </div>
      </header>
      <div class="rp-scroll">${groupsHTML || emptyTasks}</div>
    </aside>`;
  initEnProcesoDrag();
}

function buildUserFilterDropdown(allDayTasks) {
  const userIds = [...new Set(allDayTasks.map(t => t.asig).filter(Boolean))];
  if (!userIds.length) return '';

  const chevron  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  const usersIco = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  const chkIco   = `<svg class="uf-opt-chk" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  // Contenido del trigger seg\u00fan selecci\u00f3n actual
  let triggerInner;
  if (App.userFilter === 'todos') {
    triggerInner = `<div class="uf-trig-ico all">${usersIco}</div><span class="uf-trig-nm">Todos</span>`;
  } else {
    const u = findUser(App.userFilter);
    triggerInner = u
      ? `<div class="uf-trig-ico" style="background:${u.clr}">${u.ini}</div><span class="uf-trig-nm">${esc(u.nm.split(' ')[0])}</span>`
      : `<div class="uf-trig-ico all">${usersIco}</div><span class="uf-trig-nm">Todos</span>`;
  }

  // Opci\u00f3n "Todos"
  const todosOpt = `<div class="uf-opt${App.userFilter === 'todos' ? ' on' : ''}" onclick="setUserFilter('todos')">
    <div class="uf-opt-ico all">${usersIco}</div>
    <span class="uf-opt-nm">Todos</span>
    ${App.userFilter === 'todos' ? chkIco : ''}
  </div>`;

  // Opciones de usuarios
  const userOpts = userIds.map(uid => {
    const u = findUser(uid);
    if (!u) return '';
    const active = App.userFilter === uid;
    return `<div class="uf-opt${active ? ' on' : ''}" onclick="setUserFilter('${uid}')">
      <div class="uf-opt-ico" style="background:${u.clr}">${u.ini}</div>
      <span class="uf-opt-nm">${esc(u.nm)}</span>
      ${active ? chkIco : ''}
    </div>`;
  }).filter(Boolean).join('');

  return `
    <div class="uf-drop" id="ufDrop">
      <button class="uf-trig" onclick="toggleUserFilter(event)" type="button">
        ${triggerInner}
        <span class="uf-trig-chev">${chevron}</span>
      </button>
      <div class="uf-menu" id="ufMenu" style="display:none">
        <div class="uf-menu-hdr">Filtra por usuario</div>
        ${todosOpt}
        ${userOpts}
      </div>
    </div>`;
}

function toggleUserFilter(e) {
  e.stopPropagation();
  document.getElementById('tfMenu')?.style && (document.getElementById('tfMenu').style.display = 'none');
  const menu = document.getElementById('ufMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function setUserFilter(uid) {
  App.userFilter = uid;
  const menu = document.getElementById('ufMenu');
  if (menu) menu.style.display = 'none';
  renderDrawer();
}

function buildTypeFilterDropdown(allDayTasks) {
  const tipos = [...new Set(allDayTasks.map(t => t.tipo).filter(Boolean))];
  if (!tipos.length) return '';

  const chevron  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  const gridIco  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
  const chkIco   = `<svg class="uf-opt-chk" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  // Trigger
  let triggerInner;
  if (App.typeFilter === 'todos') {
    triggerInner = `<div class="uf-trig-ico all">${gridIco}</div><span class="uf-trig-nm">Tipo</span>`;
  } else {
    const tp = findActivityType(App.typeFilter);
    triggerInner = `<div class="uf-trig-ico" style="background:${tp.c}22;color:${tp.c};font-size:14px;">${tp.i}</div><span class="uf-trig-nm">${tp.nm}</span>`;
  }

  const todosOpt = `<div class="uf-opt${App.typeFilter === 'todos' ? ' on' : ''}" onclick="setTypeFilter('todos')">
    <div class="uf-opt-ico all">${gridIco}</div>
    <span class="uf-opt-nm">Todos los tipos</span>
    ${App.typeFilter === 'todos' ? chkIco : ''}
  </div>`;

  const typeOpts = tipos.map(tid => {
    const tp     = findActivityType(tid);
    const active = App.typeFilter === tid;
    return `<div class="uf-opt${active ? ' on' : ''}" onclick="setTypeFilter('${tid}')">
      <div class="uf-opt-ico" style="background:${tp.c}22;color:${tp.c};font-size:15px;">${tp.i}</div>
      <span class="uf-opt-nm">${tp.nm}</span>
      ${active ? chkIco : ''}
    </div>`;
  }).join('');

  return `
    <div class="uf-drop" id="tfDrop">
      <button class="uf-trig" onclick="toggleTypeFilter(event)" type="button">
        ${triggerInner}
        <span class="uf-trig-chev">${chevron}</span>
      </button>
      <div class="uf-menu" id="tfMenu" style="display:none">
        <div class="uf-menu-hdr">Filtra por tipo</div>
        ${todosOpt}
        ${typeOpts}
      </div>
    </div>`;
}

function toggleTypeFilter(e) {
  e.stopPropagation();
  document.getElementById('ufMenu')?.style && (document.getElementById('ufMenu').style.display = 'none');
  const menu = document.getElementById('tfMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function setTypeFilter(tipo) {
  App.typeFilter = tipo;
  const menu = document.getElementById('tfMenu');
  if (menu) menu.style.display = 'none';
  renderDrawer();
}

function buildStatusFilterButtons(dayTasks = []) {
  const statuses = ['pendiente', 'en_proceso', 'terminado'];
  const counts = statuses.reduce((acc, status) => {
    acc[status] = dayTasks.filter(t => t.estado === status).length;
    return acc;
  }, {});
  const total = dayTasks.length;
  const allOpen = statuses.every(status => App.expandedGroups.has(status));

  const allBtn = `
    <button class="sf-chip sf-chip-all ${allOpen ? 'on' : ''}" type="button" onclick="toggleAllGroups()">
      <span class="sf-chip-copy">
        <span class="sf-chip-title">Todos</span>
      </span>
      <span class="sf-chip-meta">
        <span class="sf-chip-count">${total}</span>
      </span>
    </button>`;

  const statusBtns = statuses.map(status => {
    const cfg = STATUSES[status];
    const isOpen = App.expandedGroups.has(status);
    const count = counts[status];
    const labelMap = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      terminado: 'Terminado'
    };

    return `
      <button
        class="sf-chip ${isOpen ? 'on' : ''} ${count ? '' : 'empty'}"
        type="button"
        style="--sf-accent:${cfg.c};--sf-soft:${cfg.bg};--sf-text:${cfg.tc};"
        onclick="toggleGroup('${status}')"
      >
        <span class="sf-chip-line"></span>
        <span class="sf-chip-copy">
          <span class="sf-chip-title">${labelMap[status] || cfg.nm}</span>
        </span>
        <span class="sf-chip-meta">
          <span class="sf-chip-count">${count}</span>
        </span>
      </button>`;
  }).join('');

  return `<div class="sf-bar">${allBtn}${statusBtns}</div>`;
}

// buildTaskCard eliminada (código muerto, reemplazada por buildUnifiedCard)

function buildUnifiedCard(task, status, idx) {
  const tp       = findActivityType(task.tipo);
  const user     = findUser(task.asig);
  const duration = calcDuration(actualStart(task), task.hf);
  const fmtH     = ts => { if (!ts) return ''; const d = new Date(ts); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

  const icoUsr  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const icoClk  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const icoPlay = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const icoChk  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const icoFlg  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
  const icoWarn = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  const mkPill = (ico, lbl, val, cls = '') =>
    `<div class="op-pill${cls ? ' ' + cls : ''}"><span class="op-pill-svg">${ico}</span><span class="op-pill-lbl">${lbl}</span><span class="op-pill-val">${val}</span></div>`;

  const userPill = user ? mkPill(icoUsr, 'Encargado:', esc(user.nm), 'user') : '';
  const prioPill = (task.prio && status !== 'terminado')
    ? `<div class="op-pill prio"><span class="op-pill-svg">${icoFlg}</span><span class="op-pill-val">Alta prioridad</span></div>` : '';
  const delayMeta = getTaskDelayMeta(task);
  const retrasoInlineChip = delayMeta.badgeText
    ? `<span class="op-inline-chip warn" title="${esc(delayMeta.badgeText)}"><span class="op-inline-chip-ico">${icoWarn}</span><span class="op-inline-chip-txt">${esc(delayMeta.badgeText)}</span></span>` : '';
  const retrasoPill = delayMeta.badgeText
    ? `<div class="op-pill warn"><span class="op-pill-svg">${icoWarn}</span><span class="op-pill-val">${esc(delayMeta.badgeText)}</span></div>` : '';

  const retrasoInlineChipCompact = delayMeta.badgeText
    ? `<span class="op-inline-chip warn" title="${esc(delayMeta.badgeText)}"><span class="op-inline-chip-ico">${icoWarn}</span><span class="op-inline-chip-txt">${esc(delayMeta.badgeText)}</span></span>`
    : '';
  const retrasoBadgeChip = delayMeta.badgeText
    ? `<span class="op-inline-chip warn" title="${esc(delayMeta.badgeText)}" style="padding:4px 10px;border-radius:12px;font-size:10.5px;"><span class="op-inline-chip-ico">${icoWarn}</span><span class="op-inline-chip-txt">${esc(delayMeta.badgeText)}</span></span>`
    : '';

  const prioBadgeChip = (task.prio && status !== 'terminado')
    ? `<span class="op-inline-chip prio" title="Alta prioridad" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.26);color:#dc2626;padding:4px 10px;border-radius:12px;font-size:10.5px;"><span class="op-inline-chip-ico">${icoFlg}</span><span class="op-inline-chip-txt">ALTA PRIORIDAD</span></span>`
    : '';

  let detailPills = userPill;
  if (status === 'terminado') {
    if (task.hi)   detailPills += mkPill(icoClk,  'Previsto:', task.hi);
    if (task.fIni) detailPills += mkPill(icoPlay, 'Inicio:',   fmtH(task.fIni));
    if (task.hf)   detailPills += mkPill(icoChk,  'Fin:',      task.hf);
    if (duration)  detailPills += mkPill(icoChk,  'Duraci\u00f3n:', duration.txt, 'elapsed');
  } else if (status === 'en_proceso') {
    if (task.hi)   detailPills += mkPill(icoClk,  'Previsto:', task.hi);
    if (task.fIni) detailPills += mkPill(icoPlay, 'Inicio:',   fmtH(task.fIni));
    detailPills += `<div class="op-pill elapsed"><span class="op-pill-svg">${icoClk}</span><span class="op-pill-lbl">Transcurrido:</span><span class="op-pill-val" id="lv_${task.id}">${liveElapsed(task.fIni, task.hi)}</span></div>`;
  } else {
    if (task.hi) detailPills += mkPill(icoClk, 'Previsto:', task.hi);
  }

  // Badge with embedded activity icon
  const badgeIcon = tp.i ? `<span class="op-badge-ico">${tp.i}</span>` : '';
  const badgeHtml = `<div class="op-badge-row"><span class="op-badge" style="background:linear-gradient(135deg,${tp.c}ee,${tp.c}99);box-shadow:0 2px 6px ${tp.c}40">${badgeIcon}${tp.nm.toUpperCase()}</span>${prioBadgeChip}${retrasoBadgeChip}</div>`;

  // Action button
  const chkSVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  let actionHtml = '';
  if (status === 'pendiente') {
    actionHtml = `<button class="uc-act go" onclick="event.stopPropagation();changeTaskStatus('${task.id}','en_proceso')">${icoPlay} Iniciar</button>`;
  } else if (status === 'en_proceso') {
    actionHtml = delayMeta.active
      ? `<button class="uc-act delay" onclick="event.stopPropagation();mob_openDelay('${task.id}')">${icoWarn} Cerrar demora</button>`
      : `<button class="uc-act fin" onclick="event.stopPropagation();changeTaskStatus('${task.id}','terminado')">${chkSVG} Terminar</button>`;
  } else {
    actionHtml = `<div class="tk-done-badge"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>`;
  }

  // Expanded detail
  const fmtFull = ts => ts ? new Date(ts).toLocaleString('es-PY', {hour12:false, day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '';
  const detailRows = [
    user           ? `<div class="tk-exp-row"><span class="tk-exp-l">Asignado</span><span class="tk-exp-v">${esc(user.nm)} - ${esc(user.rl)}</span></div>` : '',
    task.creadoPor ? `<div class="tk-exp-row"><span class="tk-exp-l">Creado por</span><span class="tk-exp-v">${esc(task.creadoPor)}</span></div>` : '',
    task.hi        ? `<div class="tk-exp-row"><span class="tk-exp-l">Previsto</span><span class="tk-exp-v">${esc(task.hi)}</span></div>` : '',
    task.fIni      ? `<div class="tk-exp-row"><span class="tk-exp-l">Hora inicio</span><span class="tk-exp-v">${fmtH(task.fIni)}</span></div>` : '',
    task.fFin      ? `<div class="tk-exp-row"><span class="tk-exp-l">Hora fin</span><span class="tk-exp-v">${fmtH(task.fFin)}</span></div>` : '',
    duration       ? `<div class="tk-exp-row"><span class="tk-exp-l">Duraci\u00f3n</span><span class="tk-exp-v hi">${duration.txt}</span></div>` : '',
    task.fCrea     ? `<div class="tk-exp-row"><span class="tk-exp-l">Creada</span><span class="tk-exp-v">${fmtFull(task.fCrea)}</span></div>` : '',
    delayMeta.active && delayMeta.currentReason ? `<div class="tk-exp-row"><span class="tk-exp-l" style="color:#D97706">Demora activa</span><span class="tk-exp-v" style="color:#92400E;font-weight:600">${esc(delayMeta.currentReason)}</span></div>` : '',
    delayMeta.currentStartLabel ? `<div class="tk-exp-row"><span class="tk-exp-l">Desde</span><span class="tk-exp-v">${esc(delayMeta.currentStartLabel)}</span></div>` : '',
    delayMeta.count ? `<div class="tk-exp-row"><span class="tk-exp-l">Demoras</span><span class="tk-exp-v">${delayMeta.count}</span></div>` : '',
    delayMeta.count ? `<div class="tk-exp-row"><span class="tk-exp-l">Tiempo demorado</span><span class="tk-exp-v hi">${formatMinutesCompact(delayMeta.totalWithActive)}</span></div>` : ''
  ].filter(Boolean).join('');

  const prioBtn = status !== 'terminado' && App.currentUser?.rol === 'admin'
    ? `<button class="tk-ea btn-edit" style="color:#dc2626;border-color:#fca5a5;background:#fef2f2;" onclick="togglePriority('${task.id}')">${icoFlg} ${task.prio ? 'Quitar prioridad' : 'Alta prioridad'}</button>`
    : '';
  const delayBtn = status === 'en_proceso'
    ? `<button class="tk-ea btn-delay${delayMeta.active || delayMeta.count ? ' has-delay' : ''}" onclick="mob_openDelay('${task.id}')">${delayMeta.active ? 'Cerrar demora' : 'Iniciar demora'}</button>`
    : '';
  const historyBtn = delayMeta.count || delayMeta.active
    ? `<button class="tk-ea btn-edit" onclick="openDelayHistory('${task.id}', true)">Historial</button>`
    : '';
  const editBtns = App.currentUser?.rol === 'admin'
    ? `<button class="tk-ea btn-edit" onclick="editTask('${task.id}')">Editar</button><button class="tk-ea btn-del" onclick="deleteTask('${task.id}')">Eliminar</button>`
    : '';

  const isNew  = task.id === App.lastSaved;
  const wrapId = status === 'en_proceso' ? `id="opw_${task.id}" data-id="${task.id}"` : `id="tk_${task.id}"`;
  const numEl  = status === 'en_proceso'
    ? `<div class="op-card-num op-drag-num" title="Reordenar tarea"><button class="op-drag-surface" type="button" draggable="true" data-drag-handle="true" aria-label="Reordenar tarea ${idx + 1}"></button><span>${idx + 1}</span></div>`
    : '';
  const cardStyle = status !== 'en_proceso' ? `style="border-left:4px solid ${tp.c}"` : '';

  return `
    <div class="op-card-wrapper${isNew ? ' acuse-row-new' : ''}" ${wrapId} style="--i:${idx}">
      <div class="op-card" ${cardStyle} onclick="toggleDetail('${task.id}')">
        ${numEl}
        <div class="op-card-body">
          ${badgeHtml}
          <div class="op-main-row">
            <div class="op-main">${esc(task.obs)}</div>
          </div>
          <div class="op-details-row">${detailPills}</div>
        </div>
        <div class="op-actions">${actionHtml}</div>
      </div>
      <div class="tk-exp" id="exp_${task.id}">
        <div class="tk-exp-in">
          ${detailRows}
          <div class="tk-exp-acts">${prioBtn}${delayBtn}${historyBtn}${editBtns}</div>
        </div>
      </div>
    </div>`;
}

function applyEnProcesoReorderState(container = document.getElementById('enProcesoList')) {
  if (!container) return;
  const pickedId = App.reorderPickId;
  const hasPicked = !!pickedId && !!container.querySelector(`[data-id="${pickedId}"]`);
  if (!hasPicked && App.reorderPickId) App.reorderPickId = null;

  container.classList.toggle('op-reorder-mode', !!hasPicked);
  container.querySelectorAll('[data-id]').forEach(card => {
    const isPicked = hasPicked && card.dataset.id === pickedId;
    card.classList.toggle('op-picked', isPicked);
    card.classList.toggle('op-can-drop', hasPicked && !isPicked);
  });
}

function clearEnProcesoReorderState(container = document.getElementById('enProcesoList')) {
  App.reorderPickId = null;
  applyEnProcesoReorderState(container);
}

function flashEnProcesoDrop(id) {
  const card = document.getElementById(`opw_${id}`);
  if (!card) return;
  card.classList.add('op-drop-flash');
  setTimeout(() => card.classList.remove('op-drop-flash'), 520);
}

function moveEnProcesoCard(container, fromId, toId) {
  const allCards = [...container.querySelectorAll('[data-id]')];
  const ids = allCards.map(card => card.dataset.id);
  const fromIdx = ids.indexOf(fromId);
  const toIdx   = ids.indexOf(toId);
  if (fromIdx < 0 || toIdx < 0) return false;

  ids.splice(fromIdx, 1);
  ids.splice(toIdx, 0, fromId);

  applyEnProcesoOrderIds(ids);

  App.reorderPickId = null;
  saveTasksToCache();
  renderDrawer();
  flashEnProcesoDrop(fromId);
  persistEnProcesoOrder(ids);
  return true;
}

function initEnProcesoDrag() {
  const container = document.getElementById('enProcesoList');
  if (!container) return;

  let draggingId = null;
  applyEnProcesoReorderState(container);

  container.addEventListener('click', e => {
    const handle = e.target.closest('[data-drag-handle="true"]');
    const card   = e.target.closest('[data-id]');
    const zone   = e.target.closest('.op-card, [data-drag-handle="true"]');

    if (!App.reorderPickId) {
      if (!handle || !card) return;
      e.preventDefault();
      e.stopPropagation();
      App.reorderPickId = card.dataset.id;
      applyEnProcesoReorderState(container);
      return;
    }

    if (!card || !zone) return;
    e.preventDefault();
    e.stopPropagation();

    if (card.dataset.id === App.reorderPickId) {
      clearEnProcesoReorderState(container);
      return;
    }

    moveEnProcesoCard(container, App.reorderPickId, card.dataset.id);
    App.reorderPickId = null;
  }, true);

  container.addEventListener('dragstart', e => {
    if (!e.target.closest('[data-drag-handle="true"]')) { e.preventDefault(); return; }
    const card = e.target.closest('[data-id]');
    if (!card) return;
    clearEnProcesoReorderState(container);
    draggingId = card.dataset.id;
    container.classList.add('op-drag-active');
    const opCard = card.querySelector('.op-card');
    if (opCard) e.dataTransfer.setDragImage(opCard, 50, opCard.offsetHeight / 2);
    setTimeout(() => card.classList.add('op-dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggingId);
  });

  container.addEventListener('dragend', () => {
    container.classList.remove('op-drag-active');
    container.querySelectorAll('.op-dragging, .op-drag-over').forEach(el =>
      el.classList.remove('op-dragging', 'op-drag-over')
    );
    draggingId = null;
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('[data-id]');
    if (!card || card.dataset.id === draggingId) return;
    container.querySelectorAll('.op-drag-over').forEach(el => el.classList.remove('op-drag-over'));
    card.classList.add('op-drag-over');
  });

  container.addEventListener('drop', e => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain');
    const toCard = e.target.closest('[data-id]');
    if (!toCard || toCard.dataset.id === fromId) return;
    moveEnProcesoCard(container, fromId, toCard.dataset.id);
  });
}

// Actualizaci\u00f3n del contador live (cada 1s)
setInterval(() => {
  if (App.view !== 'cal' || !App.selectedDay) return;
  const liveTasks = App.tasks.filter(t => t.fecha === App.selectedDay && t.estado === 'en_proceso' && (t.fIni || t.hi));
  if (!liveTasks.length) return;
  liveTasks.forEach(t => {
    const el = document.getElementById('lv_' + t.id);
    if (el) el.textContent = liveElapsed(t.fIni, t.hi);
  });
}, 1000);

// ???? 10. ACCIONES DE CALENDARIO Y TAREAS ??????????????????????????????????????????

function selectDay(key) {
  App.selectedDay = key === App.selectedDay ? null : key;
  App.search = '';
  document.querySelectorAll('.c-day[data-key]').forEach(el => {
    el.classList.toggle('sel', el.dataset.key === App.selectedDay);
  });
  scheduleDrawerRender();
}
function changeMonth(dir)  { App.month = Number(App.month) + dir; if (App.month > 11) { App.month = 0; App.year++; } if (App.month < 0) { App.month = 11; App.year--; } App.selectedDay = (App.year === new Date().getFullYear() && App.month === new Date().getMonth()) ? todayKey() : (App.year + '-' + pad2(App.month + 1) + '-01'); render(); }
function goToday()         { const d = new Date(); App.year = d.getFullYear(); App.month = d.getMonth(); App.selectedDay = todayKey(); render(); }
function toggleAllGroups() {
  const statuses = ['en_proceso', 'pendiente', 'terminado'];
  const allOpen = statuses.every(status => App.expandedGroups.has(status));
  App.expandedGroups = allOpen ? new Set() : new Set(statuses);
  scheduleDrawerRender();
}
function toggleGroup(st)   { if (App.expandedGroups.has(st)) App.expandedGroups.delete(st); else App.expandedGroups.add(st); scheduleDrawerRender(); }
function toggleDetail(id)  { document.getElementById('exp_' + id)?.classList.toggle('show'); }

// ???? ACCIONES DE TAREAS ????????????????????????????????????????????????????????????????????????????????

let _pendingEarlyStart = null;
let _pendingEarlyDate  = null;

function isScheduledForFuture(fecha) {
  if (!fecha) return false;
  return fecha > todayKey();
}

function isBeforeScheduled(hi) {
  if (!hi) return false;
  const now = new Date();
  const [h, m] = hi.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() < h * 60 + m;
}

function cancelEarlyDate() {
  _pendingEarlyDate = null;
  document.getElementById('earlyDateModal').style.display = 'none';
}

function confirmEarlyDate() {
  if (!_pendingEarlyDate) return;
  const { id, newStatus } = _pendingEarlyDate;
  _pendingEarlyDate = null;
  document.getElementById('earlyDateModal').style.display = 'none';
  const task = App.tasks.find(t => t.id === id);
  if (task) {
    const now = new Date();
    task.fecha = todayKey();
    task.hi    = timeStr(now.getHours(), now.getMinutes());
  }
  changeTaskStatus(id, newStatus);
}

function cancelEarlyStart() {
  _pendingEarlyStart = null;
  document.getElementById('earlyStartModal').style.display = 'none';
}

function confirmEarlyStart() {
  if (!_pendingEarlyStart) return;
  const { id, newStatus } = _pendingEarlyStart;
  _pendingEarlyStart = null;
  document.getElementById('earlyStartModal').style.display = 'none';
  const task = App.tasks.find(t => t.id === id);
  if (task) {
    const now = new Date();
    task.hi = timeStr(now.getHours(), now.getMinutes());
  }
  changeTaskStatus(id, newStatus);
}

async function changeTaskStatus(id, newStatus) {
  const task = App.tasks.find(t => t.id === id);
  if (!task) return;

  if (newStatus === 'terminado' && task.delayActive) {
    toast('Cierra la demora activa antes de finalizar la tarea');
    return;
  }

  // Fecha futura ?  preguntar si adelantar al d\u00eda de hoy (tiene prioridad sobre la hora)
  if (newStatus === 'en_proceso' && !task.fIni && isScheduledForFuture(task.fecha)) {
    _pendingEarlyDate = { id, newStatus };
    document.getElementById('earlyDateFecha').textContent = formatDate(task.fecha);
    document.getElementById('earlyDateModal').style.display = 'flex';
    return;
  }

  // Misma fecha pero hora a\u00fan no lleg\u00f3 ?  preguntar inicio anticipado
  if (newStatus === 'en_proceso' && !task.fIni && task.hi && isBeforeScheduled(task.hi)) {
    _pendingEarlyStart = { id, newStatus };
    document.getElementById('earlyStartHi').textContent = task.hi;
    document.getElementById('earlyStartModal').style.display = 'flex';
    return;
  }

  const prev = { ...task };
  const now  = new Date();
  const tp   = findActivityType(task.tipo);
  const prevStatus = task.estado;

  task.estado = newStatus;
  if (newStatus === 'en_proceso') {
    if (prevStatus !== 'en_proceso' && (task.pOrder == null || task.pOrder === '')) {
      task.pOrder = getNextEnProcesoOrder(task);
    }
    if (!task.fIni) task.fIni = now.toISOString();
  }
  if (newStatus === 'terminado') {
    task.fFin = now.toISOString();
    task.hf   = timeStr(now.getHours(), now.getMinutes());
  }
  patchTaskDOM(task, prevStatus, newStatus);

  // Feedback optimista inmediato ? no espera al servidor
  if (newStatus === 'en_proceso') {
    toast(`${tp.nm} iniciada`);
    addNotification({ type: 'started', task, message: `Iniciada: ${tp.nm}` });
  } else {
    const dur = calcDuration(actualStart(task), task.hf);
    toast(`${tp.nm} terminada${dur ? ' en ' + dur.txt : ''}`);
    addNotification({ type: 'done', task, message: `Completada: ${tp.nm}` });
  }
  saveTasksToCache();

  // Sincroniza con el servidor en background ? si falla, revierte
  try {
    await syncTask(task, 'save_task');
  } catch (e) {
    Object.assign(task, prev);
    patchTaskDOM(task, newStatus, prevStatus);
    saveTasksToCache();
    toast('No se pudo actualizar - revertido');
  }
}

function patchTaskDOM(task, prevStatus, newStatus) {
  const oldWrap = document.getElementById(`opw_${task.id}`) || document.getElementById(`tk_${task.id}`);
  const oldExp = document.getElementById(`exp_${task.id}`);
  
  if (oldWrap) oldWrap.remove();
  if (oldExp) oldExp.remove();

  if (App.selectedDay === task.fecha && App.department === task.dep) {
    const targetList = document.getElementById(newStatus === 'en_proceso' ? 'enProcesoList' : `${newStatus}List`);
    if (targetList) {
      const items = App.tasks.filter(t => t.fecha === App.selectedDay && t.dep === App.department && t.estado === newStatus);
      let newIdx = items.length - 1;
      if (newStatus === 'en_proceso') {
        const enProcesoItems = items.slice().sort(compareEnProcesoOrder);
        newIdx = enProcesoItems.findIndex(t => t.id === task.id);
      }
      
      const newHtml = buildUnifiedCard(task, newStatus, newIdx);
      targetList.insertAdjacentHTML('beforeend', newHtml);

      // Actualizar contadores
      ['en_proceso', 'pendiente', 'terminado'].forEach(st => {
        const groupBtn = document.querySelector(`button[onclick="toggleGroup('${st}')"] .sg-cnt`);
        if (groupBtn) {
          groupBtn.textContent = App.tasks.filter(t => t.fecha === App.selectedDay && t.dep === App.department && t.estado === st).length;
        }
      });
      initEnProcesoDrag();
    }
  }

  if (typeof IS_MOBILE !== 'undefined' && IS_MOBILE && typeof mob_renderTaskList === 'function') {
    mob_renderTaskList();
    mob_renderStats();
  } else {
    renderCalendar();
  }
}

function editTask(id) {
  if (App.currentUser?.rol !== 'admin') { toast('Solo los administradores pueden editar tareas'); return; }
  const task = App.tasks.find(t => t.id === id);
  if (task) openModal({ ...task });
}

async function deleteTask(id) {
  if (App.currentUser?.rol !== 'admin') { toast('Solo los administradores pueden eliminar tareas'); return; }
  const ok = await confirmAction('\u00bfEst\u00e1s seguro de eliminar esta tarea? Esta acci\u00f3n se puede deshacer temporalmente.');
  if (!ok) return;
  const idx = App.tasks.findIndex(t => t.id === id);
  if (idx < 0) return;
  const removed = { ...App.tasks[idx] };
  App.lastDeleted = removed;
  App.tasks = App.tasks.filter(t => t.id !== id);
  render(); if (IS_MOBILE) mob_render();
  toast('Eliminada', true);

  try {
    await syncTask(removed, 'delete_task');
  } catch (e) {
    App.tasks.splice(idx, 0, removed);
    App.lastDeleted = null;
    render(); if (IS_MOBILE) mob_render();
    toast('No se pudo eliminar la tarea');
  } finally {
    saveTasksToCache();
  }
}

async function undoDelete() {
  if (!App.lastDeleted) return;
  const restored = { ...App.lastDeleted };
  App.tasks.push(restored);
  App.lastDeleted = null;
  render(); if (IS_MOBILE) mob_render();
  document.getElementById('toast').classList.remove('show');
  toast('Restaurada');
  saveTasksToCache();
  try {
    await syncTask(restored, 'save_task');
  } catch (e) {
    App.tasks = App.tasks.filter(t => t.id !== restored.id);
    render(); if (IS_MOBILE) mob_render();
    saveTasksToCache();
    toast('No se pudo restaurar');
  }
}

async function togglePriority(id) {
  if (App.currentUser?.rol !== 'admin') { toast('Solo los administradores pueden cambiar la prioridad'); return; }
  const task = App.tasks.find(t => t.id === id);
  if (!task) return;
  const prev  = task.prio;
  task.prio   = !task.prio;
  render(); if (IS_MOBILE) mob_render();
  toast(task.prio ? 'Prioridad alta activada' : 'Prioridad removida');
  saveTasksToCache();
  try {
    await syncTask(task, 'save_task');
  } catch (e) {
    task.prio = prev;
    render(); if (IS_MOBILE) mob_render();
    saveTasksToCache();
    toast('No se pudo actualizar la prioridad');
  }
}

function exportCSV() {
  const currentMonthPrefix = `${App.year}-${pad2(App.month + 1)}`;
  const monthTasks = App.tasks.filter(t => {
    return t.fecha && t.fecha.startsWith(currentMonthPrefix);
  });
  let csv = 'ID,Fecha,Tipo,Observacion,HoraInicio,HoraFin,Estado,Asignado,Duraci\u00f3n\n';
  monthTasks.forEach(t => {
    const u = findUser(t.asig), dur = calcDuration(actualStart(t), t.hf);
    csv += `${t.id},${t.fecha},${findActivityType(t.tipo).nm},"${t.obs}",${actualStart(t) || ''},${t.hf || ''},${STATUSES[t.estado].nm},${u ? u.nm : ''},${dur ? dur.txt : ''}\n`;
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Export_${MONTHS[App.month]}_${App.year}.csv`;
  a.click();
  toast(`Exportando ${MONTHS[App.month]} ${App.year}`);
}

// ???? 11. MODAL DE NUEVA / EDITAR TAREA ??????????????????????????????????????????????

function openModal(task) {
  App.editingTask = task || null;
  const isEdit    = !!task;
  const nowDefaults = currentTaskDateTime();
  const defaults  = {
    fecha:  nowDefaults.date,
    tipo:   '',
    obs:    '',
    hi:     nowDefaults.time,
    hf:     null,
    estado: 'pendiente',
    asig:   '',
    prio:   false,
    dep:    App.department
  };
  App.formData = { ...(task || defaults) };

  const typeButtons = ACTIVITY_TYPES
    .filter(tp => (tp.dep || ['fabrica','deposito']).includes(App.department))
    .map(tp => {
      const active = App.formData.tipo === tp.id;
      return `<div class="tp-opt ${active ? 'on' : ''}" data-t="${tp.id}" onclick="selectModalType('${tp.id}')"
        style="${active ? `border-color:${tp.c};color:${tp.c}` : ''}">
        <span class="ti">${tp.i}</span><span class="tn">${tp.nm}</span>
      </div>`;
    }).join('');

  // Estado solo en edici\u00f3n
  let statusHTML = '';
  if (isEdit) {
    statusHTML = '<div class="fg-l" style="margin-bottom:8px;">Estado</div><div class="es-opts">';
    Object.entries(STATUSES).forEach(([k, e]) => {
      const active = App.formData.estado === k;
      statusHTML += `<div class="es-o ${active ? 'on' : ''}" data-e="${k}" onclick="selectModalStatus('${k}')"
        style="${active ? `border-color:${e.c};color:${e.tc};background:${e.bg}` : ''}">${e.i} ${e.nm}</div>`;
    });
    statusHTML += '</div>';
  }

  const editIconSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
  const newIconSVG  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

  document.getElementById('mdl').innerHTML = `
    <div class="modal-sidepanel"></div>
    <header class="mdl-h">
      <h3 class="mdl-t" style="display:flex;align-items:center;gap:8px;">
        ${isEdit ? editIconSVG + ' Editar Tarea' : newIconSVG + ' Nueva Tarea'}
      </h3>
      <button class="mdl-x" onclick="closeModal()">&#10005;</button>
    </header>
    <div class="mdl-b mdl-fg">
      <div class="mf mf-tipo">
        <label class="fg-l">Tipo de tarea * <span class="fchk" id="chk-tipo"></span></label>
        <div class="tp-grid" id="mTG">${typeButtons}</div>
      </div>
      <div class="mf mf-obs">
        <label class="fg-l">Observaci\u00f3n</label>
        <textarea class="fg-ta" id="mObs" placeholder="Ej: Descarga contenedor #4521 zona norte"
          style="min-height:100px;">${esc(App.formData.obs)}</textarea>
      </div>
      <div class="mf-right-col">
        <div class="mf mf-time fg-r">
          <div>
            <label class="fg-l">Hora inicio <span class="fchk" id="chk-hi"></span></label>
            <input type="time" class="fg-in" id="mHi" value="${App.formData.hi || ''}">
          </div>
          <div>
            <label class="fg-l">Fecha <span class="fchk" id="chk-fe"></span></label>
            <input type="date" class="fg-in" id="mFe" value="${App.formData.fecha}">
          </div>
        </div>
        <div class="mf mf-prio">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--text-main);">
            <input type="checkbox" id="mPrio" ${App.formData.prio ? 'checked' : ''} style="width:16px;height:16px;accent-color:#ef4444;">
            ${PRIORITY_SVG} Marcar como Prioridad Alta
          </label>
        </div>
        <div class="mf mf-asig">
          <label class="fg-l">Asignar a <span class="fchk" id="chk-asig"></span></label>
          <div class="cus-sel" id="cUsrSel" onclick="toggleUserSelect()">
            <div class="cus-sel-val" id="cUsrVal"></div>
            <div class="cus-sel-opts" id="cUsrOpts" onclick="event.stopPropagation()"></div>
          </div>
        </div>
        ${isEdit ? `<div class="mf mf-stat">${statusHTML}</div>` : ''}
      </div>
    </div>
    <footer class="mdl-f">
      <button class="m-can" onclick="closeModal()">Cancelar</button>
      <button class="m-sav" onclick="saveTaskForm()">${isEdit ? 'Guardar' : 'Crear Tarea'}</button>
    </footer>`;

  renderUserSelect();
  const bg = document.getElementById('mBg');
  bg.classList.remove('is-closing');
  bg.classList.add('is-open');
  setTimeout(() => {
    document.getElementById('mObs')?.focus();
    document.getElementById('mHi')?.addEventListener('input', updateModalChecks);
    document.getElementById('mFe')?.addEventListener('input', updateModalChecks);
    updateModalChecks();
  }, 100);
}

function renderUserSelect() {
  const fd     = App.formData;
  const valEl  = document.getElementById('cUsrVal');
  const optsEl = document.getElementById('cUsrOpts');
  if (!valEl || !optsEl) return;

  if (!fd.asig) {
    valEl.innerHTML = `<span style="color:var(--text-muted)">Sin asignar</span>`;
  } else {
    const u = findUser(fd.asig);
    valEl.innerHTML = u
      ? `<div class="cus-opt-in"><div class="av-mini" style="background:#F1F5F9;border:1px solid #CBD5E1;">${HELMET_SVG}</div><span>${esc(u.nm)} <small style="color:var(--text-muted)">(${esc(u.rl)})</small></span><button class="clr-usr" onclick="event.stopPropagation();selectUser('')" title="Quitar">&#10005;</button></div>`
      : 'Desconocido';
  }

  const deptUsers = activeUsers().filter(u => u.rol === 'operativo' && (u.dep === App.department || u.dep === 'admin'));
  let html = `<div class="cus-opt ${!fd.asig ? 'on' : ''}" onclick="selectUser('')">Sin asignar</div>`;
  deptUsers.forEach(u => {
    html += `<div class="cus-opt ${fd.asig === u.id ? 'on' : ''}" onclick="selectUser('${u.id}')">
      <div class="av-mini" style="background:#F1F5F9;border:1px solid #CBD5E1;">${HELMET_SVG}</div>
      <div>${esc(u.nm)} <span style="font-size:11px;color:var(--text-muted)">${esc(u.rl)}</span></div>
    </div>`;
  });
  if (!deptUsers.length) {
    html += `<div class="cus-opt" style="cursor:default;opacity:.7;">No hay usuarios activos para este sector</div>`;
  }
  optsEl.innerHTML = html;
}

function toggleUserSelect()  { document.getElementById('cUsrSel')?.classList.toggle('open'); }
function selectUser(id)      { App.formData.asig = id; document.getElementById('cUsrSel')?.classList.remove('open'); document.getElementById('cUsrSel')?.classList.remove('err'); renderUserSelect(); updateModalChecks(); }
function closeModal()        { const bg = document.getElementById('mBg'); bg.classList.remove('is-open'); bg.classList.add('is-closing'); setTimeout(() => bg.classList.remove('is-closing'), 520); App.editingTask = null; }

function updateModalChecks() {
  const fd = App.formData;
  const set = (id, ok) => { const el = document.getElementById(id); if (el) { el.className = ok ? 'fchk ok' : 'fchk'; el.textContent = ok ? 'OK' : ''; } };
  set('chk-tipo', !!fd.tipo);
  set('chk-asig', true);
  set('chk-hi',   !!(document.getElementById('mHi')?.value));
  set('chk-fe',   !!(document.getElementById('mFe')?.value));
}

function selectModalType(id) {
  App.formData.tipo = id;
  document.querySelectorAll('#mTG .tp-opt').forEach(el => {
    const tp = findActivityType(el.dataset.t);
    const active = el.dataset.t === id;
    el.classList.toggle('on', active);
    el.style.borderColor = active ? tp.c : '';
    el.style.color       = active ? tp.c : '';
  });
  updateModalChecks();
}

function selectModalStatus(k) {
  App.formData.estado = k;
  document.querySelectorAll('.es-o').forEach(el => {
    const e = STATUSES[el.dataset.e];
    const active = el.dataset.e === k;
    el.classList.toggle('on', active);
    el.style.borderColor = active ? e.c  : '';
    el.style.color       = active ? e.tc : '';
    el.style.background = active ? e.bg : '';
  });
}

async function saveTaskForm() {
  const fd = App.formData;
  const nowDefaults = currentTaskDateTime();
  fd.obs   = document.getElementById('mObs').value.trim();
  fd.hi    = document.getElementById('mHi').value;
  fd.fecha = document.getElementById('mFe').value;
  fd.prio  = document.getElementById('mPrio').checked;
  fd.dep   = App.department;

  if (!App.editingTask) {
    fd.hi = fd.hi || nowDefaults.time;
    fd.fecha = fd.fecha || nowDefaults.date;
  }

  let valid = true;

  // Tipo de tarea
  if (!fd.tipo) {
    document.querySelectorAll('#mTG .tp-opt').forEach(el => el.style.borderColor = '#F87171');
    valid = false;
  }
  const usrSel = document.getElementById('cUsrSel');
  usrSel?.classList.remove('err');
  // Hora inicio (requerida)
  const hiEl = document.getElementById('mHi');
  if (!fd.hi) { hiEl?.classList.add('err'); valid = false; }
  else         { hiEl?.classList.remove('err'); }
  // Fecha (requerida)
  const feEl = document.getElementById('mFe');
  if (!fd.fecha) { feEl?.classList.add('err'); valid = false; }
  else            { feEl?.classList.remove('err'); }

  if (!valid) {
    toast('Por favor, completa los campos obligatorios en rojo', false);
    return;
  }

  if (App.editingTask) {
    const idx = App.tasks.findIndex(t => t.id === App.editingTask.id);
    if (idx < 0) return;
    const savedId = App.editingTask.id;
    const prev    = { ...App.tasks[idx] };
    App.tasks[idx] = { ...App.tasks[idx], ...fd };
    App.lastSaved  = savedId;
    closeModal();
    render();
    toast('Actualizada');
    saveTasksToCache();
    try {
      await syncTask(App.tasks[idx], 'save_task');
    } catch (e) {
      App.tasks[idx] = prev;
      App.lastSaved  = null;
      render();
      saveTasksToCache();
      toast(formatActionError(e, 'No se pudo guardar la tarea'));
    }
  } else {
    const newTask = { ...fd, id: generateId(), fCrea: new Date().toISOString(), creadoPor: App.currentUser?.nm || '' };
    if (newTask.tipo === 'atencion_cliente') {
      const _now = new Date();
      newTask.estado = 'en_proceso';
      newTask.fIni   = _now.toISOString();
      newTask.fecha  = todayKey();
      newTask.hi     = timeStr(_now.getHours(), _now.getMinutes());
      newTask.pOrder = -1;
    }
    App.tasks.unshift(newTask);
    App.lastSaved = newTask.id;
    // Navegar a la fecha de la tarea reci\u00e9n creada
    const [ny, nm] = newTask.fecha.split('-').map(Number);
    App.year = ny; App.month = nm - 1; App.selectedDay = newTask.fecha;
    closeModal();
    render();
    toast('Tarea creada');
    saveTasksToCache();
    try {
      await syncTask(newTask, 'save_task');
    } catch (e) {
      App.tasks = App.tasks.filter(t => t.id !== newTask.id);
      App.lastSaved = null;
      render();
      saveTasksToCache();
      toast(formatActionError(e, 'No se pudo crear la tarea'));
    }
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.contentEditable === 'true') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (key === 'n') { e.preventDefault(); fabAction(); }
  if (key === 'f') { e.preventDefault(); openSearch(); }
  if (key === 'escape') {
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchOverlay && searchOverlay.style.display !== 'none') { closeSearch(); return; }
  }
});
document.addEventListener('click', e => {
  if (!e.target.closest('#cUsrSel')) {
    document.getElementById('cUsrSel')?.classList.remove('open');
  }
  if (!e.target.closest('#ufDrop')) {
    const m = document.getElementById('ufMenu');
    if (m) m.style.display = 'none';
  }
  if (!e.target.closest('#tfDrop')) {
    const m = document.getElementById('tfMenu');
    if (m) m.style.display = 'none';
  }
});

// ???? 12. RESUMEN (DASHBOARD) ??????????????????????????????????????????????????????????????????

function renderSummary() {
  const v = document.getElementById('v-res');
  if (!v) return;
  syncTopbarKpis();

  const deps = (App.currentUser && App.currentUser.rol === 'operativo')
    ? [App.currentUser.dep]
    : ['fabrica', 'deposito'];
  const gridStyle = deps.length === 1
    ? 'grid-template-columns: minmax(0, 800px); justify-content: center;'
    : 'grid-template-columns: 1fr 1fr;';

  const prevArrow = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  const nextArrow = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

  const monthNav = `<div style="display:flex;justify-content:center;margin-bottom:18px;">
    <div style="display:inline-flex;align-items:center;gap:4px;">
      <button onclick="changeMonth(-1);if(App.view==='res')renderSummary();" style="width:28px;height:28px;border:none;border-radius:7px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:background .12s,color .12s;" onmouseover="this.style.background='var(--bg-surface)';this.style.color='var(--text-main)'" onmouseout="this.style.background='transparent';this.style.color='var(--text-muted)'">${prevArrow}</button>
      <span style="font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--text-main);min-width:120px;text-align:center;letter-spacing:-.2px;">${MONTHS[App.month]} ${App.year}</span>
      <button onclick="changeMonth(1);if(App.view==='res')renderSummary();" style="width:28px;height:28px;border:none;border-radius:7px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:background .12s,color .12s;" onmouseover="this.style.background='var(--bg-surface)';this.style.color='var(--text-main)'" onmouseout="this.style.background='transparent';this.style.color='var(--text-muted)'">${nextArrow}</button>
    </div>
  </div>`;

  let html = `<div style="display:flex;flex-direction:column;height:100%;">${monthNav}<div class="res-dept-grid" style="display:grid;${gridStyle}gap:24px;flex:1;min-height:0;">`;

  deps.forEach(dep => {
    const depName = dep === 'fabrica' ? 'F\u00e1brica' : 'Dep\u00f3sito';
    const summaryPrefix = `${App.year}-${pad2(App.month + 1)}`;
    const monthTasks = App.tasks.filter(t => {
      return (t.fecha && t.fecha.startsWith(summaryPrefix)) && t.dep === dep;
    });

    const byStatus = { pendiente: 0, en_proceso: 0, terminado: 0 };
    const byType   = {};
    let totalMinutes = 0, durationCount = 0;

    monthTasks.forEach(t => {
      byStatus[t.estado]++;
      byType[t.tipo] = (byType[t.tipo] || 0) + 1;
      if (t.hi && t.hf) {
        const dur = calcDuration(actualStart(t), t.hf);
        if (dur) { totalMinutes += dur.total; durationCount++; }
      }
    });

    const avgMin = durationCount ? Math.round(totalMinutes / durationCount) : 0;
    const avgTxt = avgMin > 60 ? `${Math.floor(avgMin / 60)}h ${avgMin % 60}m` : `${avgMin}m`;
    const eff    = monthTasks.length ? Math.round(byStatus.terminado / monthTasks.length * 100) : 0;
    const maxType= Math.max(...Object.values(byType), 1);

    // Rendimiento por encargado
    const userStats = {};
    monthTasks.forEach(t => {
      if (t.asig) {
        if (!userStats[t.asig]) userStats[t.asig] = { total: 0, done: 0 };
        userStats[t.asig].total++;
        if (t.estado === 'terminado') userStats[t.asig].done++;
      }
    });

    let leaderboardHTML = '<article class="res-card"><h3 class="res-card-t">Rendimiento Encargados</h3><div style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">';
    const sortedUsers = Object.keys(userStats).sort((a, b) => userStats[b].done - userStats[a].done);
    sortedUsers.forEach(id => {
      const u = findUser(id); if (!u) return;
      const stat = userStats[id];
      const pct  = Math.round(stat.done / stat.total * 100);
      const color = pct >= 80 ? 'var(--status-ok)' : pct >= 50 ? 'var(--status-pending)' : 'var(--status-error)';
      leaderboardHTML += `
        <div style="display:flex;align-items:center;background:var(--bg-surface);padding:12px;border-radius:8px;border:1px solid var(--border-color);">
          <div class="av-mini" style="background:${u.clr};color:#fff;margin-right:12px;">${u.ini}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;color:var(--text-main);">${esc(u.nm)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">${stat.done} de ${stat.total} completadas</div>
            <div style="width:100%;height:6px;background:var(--bg-app);border-radius:3px;overflow:hidden;">
              <div style="height:100%;background:${color};width:${pct}%"></div>
            </div>
          </div>
          <div style="font-weight:800;font-size:18px;margin-left:16px;color:${color}">${pct}%</div>
        </div>`;
    });
    if (!sortedUsers.length) leaderboardHTML += '<div style="color:var(--text-muted);font-size:13px;">No hay tareas asignadas.</div>';
    leaderboardHTML += '</div></article>';

    let bars = '';
    ACTIVITY_TYPES.filter(tp => (tp.dep || ['fabrica','deposito']).includes(dep)).forEach(tp => {
      const cnt = byType[tp.id] || 0;
      const pct = (cnt / maxType) * 100;
      bars += `<div class="res-bar-row">
        <div class="res-bar-nm"><span>${tp.i}</span>${tp.nm}</div>
        <div class="res-bar-track"><div class="res-bar-fill" style="width:${pct}%;background:${tp.c}"></div></div>
        <span class="res-bar-n">${cnt}</span>
      </div>`;
    });

    let effs = '';
    Object.entries(STATUSES).forEach(([k, e]) => {
      const cnt = byStatus[k], pct = monthTasks.length ? Math.round(cnt / monthTasks.length * 100) : 0;
      effs += `<div class="res-eff-item">
        <div class="res-eff-pct" style="color:${e.c}">${pct}%</div>
        <div class="res-eff-nm">${e.nm}</div>
        <div class="res-eff-cnt">${cnt} tarea${cnt !== 1 ? 's' : ''}</div>
      </div>`;
    });

    html += `
      <div class="res-wrap" style="background:var(--bg-surface-hover);padding:24px;border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow-y:auto;">
        <div class="res-title" style="display:flex;align-items:center;gap:8px;">
          <span style="width:7px;height:7px;border-radius:50%;background:${dep === 'fabrica' ? '#2563EB' : '#059669'};flex-shrink:0;"></span>
          ${depName}
          <span style="font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:.3px;">${MONTHS[App.month].toUpperCase()} ${App.year}</span>
        </div>
        <div class="res-content-grid" style="grid-template-columns:1fr;gap:16px;">
          <article class="res-card"><h3 class="res-card-t">Estado General</h3><div class="res-eff">${effs}</div></article>
          ${leaderboardHTML}
          <article class="res-card"><h3 class="res-card-t">Distribuci\u00f3n por Tipo</h3>${bars}</article>
        </div>
      </div>`;
  });

  html += '</div></div>';
  v.innerHTML = html;
}

// ?? 13. GESTI?N DE USUARIOS ?????????????????????????????????
// Extra?do a app-users.js

// ?? 14. COLA OFFLINE Y SINCRONIZACI?N ???????????????????????
// Extra?do a app-sync.js


// ???? 16. B?aSQUEDA GLOBAL ??????????????????????????????????????????????????????????????????????????

function openSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  const input = document.getElementById('searchInput');
  if (input) { input.value = ''; input.focus(); }
  performSearch('');
}

function closeSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (overlay) overlay.style.display = 'none';
}

const doSearch = debounce(query => performSearch(query), 250);

function performSearch(query) {
  const results = document.getElementById('searchResults');
  if (!results) return;

  const q = String(query || '').trim().toLowerCase();

  if (!q) {
    results.innerHTML = '<div class="search-hint">Escribe para buscar en todas las tareas...</div>';
    return;
  }

  const matches = App.tasks.filter(t => {
    const tp = findActivityType(t.tipo);
    const u  = findUser(t.asig);
    return (
      tp.nm.toLowerCase().includes(q) ||
      t.obs.toLowerCase().includes(q)  ||
      t.fecha.includes(q)              ||
      (u && u.nm.toLowerCase().includes(q)) ||
      (t.creadoPor && t.creadoPor.toLowerCase().includes(q))
    );
  }).slice(0, 60);

  if (!matches.length) {
    results.innerHTML = `<div class="search-empty">Sin resultados para "<b>${esc(q)}</b>"</div>`;
    return;
  }

  // Agrupar por fecha descendente
  const byDate = {};
  matches.forEach(t => { if (!byDate[t.fecha]) byDate[t.fecha] = []; byDate[t.fecha].push(t); });
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const arrSVG = `<svg class="search-item-arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

  results.innerHTML = sortedDates.map(fecha => {
    const items = byDate[fecha].map(t => {
      const tp    = findActivityType(t.tipo);
      const st    = STATUSES[t.estado];
      const dep   = t.dep === 'deposito' ? 'Dep\u00f3sito' : 'F\u00e1brica';
      const u     = findUser(t.asig);
      const uName = u ? esc(u.nm) : '';
      return `<div class="search-item" onclick="searchGoTo('${esc(fecha)}','${t.dep}')">
        <div class="search-item-icon" style="background:${tp.c}22;color:${tp.c}">${tp.i}</div>
        <div class="search-item-body">
          <div class="search-item-tipo" style="color:${tp.c}">${tp.nm}</div>
          <div class="search-item-obs">${esc(t.obs) || '-'}</div>
          <div class="search-item-meta">
            <span style="color:${st.c};font-weight:600;">${st.nm}</span>
            <span class="search-item-sep"> - </span>
            <span class="search-item-dep-badge">${dep}</span>
            ${uName ? `<span class="search-item-sep"> - </span><span>${uName}</span>` : ''}
          </div>
        </div>
        ${arrSVG}
      </div>`;
    }).join('');
    return `<div class="search-group">
      <div class="search-date">${formatDate(fecha)}</div>
      ${items}
    </div>`;
  }).join('');
}

function searchGoTo(fecha, dep) {
  closeSearch();
  const parts = fecha.split('-').map(Number);
  App.year       = parts[0];
  App.month      = parts[1] - 1;
  App.selectedDay = fecha;
  App.department  = dep;
  const bf = document.getElementById('btnDepFabrica');
  const bd = document.getElementById('btnDepDeposito');
  if (bf) bf.classList.toggle('on', dep === 'fabrica');
  if (bd) bd.classList.toggle('on', dep === 'deposito');
  setView('cal');
}

// Cerrar search con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('searchOverlay');
    if (overlay && overlay.style.display !== 'none') { closeSearch(); e.preventDefault(); }
  }
});

// ???? 17. FAB Y ARRANQUE ????????????????????????????????????????????????????????????????????????????

function fabAction() {
  if (App.view !== 'cal') { setView('cal'); }
  if (!App.selectedDay)   { App.selectedDay = todayKey(); render(); }
  openModal();
}

