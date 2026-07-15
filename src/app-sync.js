// ============================================================
//  ALAS Fabrica - app-sync.js
//  Cola offline y sincronizacion (Google Sheets o Supabase)
// ============================================================

function isSupabaseReady() {
  return window.SUPABASE && window.SUPABASE.loadTasks;
}

function isUsingGAS() {
  return !isSupabaseReady();
}

const QUEUE_KEY = 'ALAS_OFFLINE_QUEUE_V1';
const DEFAULT_REQUEST_TIMEOUT_MS = 20000;
const USERS_REQUEST_TIMEOUT_MS = 20000;
const TASKS_REQUEST_TIMEOUT_MS = 30000;
const WRITE_REQUEST_TIMEOUT_MS = 30000;

let isProcessingQueue = false;

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function hasPendingQueue() {
  return getQueue().length > 0;
}

function addToQueue(action, payload) {
  const queue = getQueue();
  const id = payload.id || (payload.task && payload.task.id);
  const idx = queue.findIndex(item => {
    const itemId = item.payload.id || (item.payload.task && item.payload.task.id);
    return item.action === action && itemId === id;
  });

  const entry = { action, payload, ts: Date.now() };
  if (idx >= 0) queue[idx] = entry;
  else queue.push(entry);
  saveQueue(queue);
}

function updateOfflineIndicator() {
  const count = getQueue().length;
  const el = document.getElementById('offlineIndicator');
  const countEl = document.getElementById('offlineCnt');
  if (el) el.style.display = count > 0 ? 'flex' : 'none';
  if (countEl) countEl.textContent = count;
}

function isNetworkError(error) {
  if (!navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  const msg = String(error?.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('timeout')
  );
}

function canProcessQueue() {
  return !!(navigator.onLine && App.currentUser && App.sessionToken);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function processQueue(options = {}) {
  const { silent = false, refreshAfter = true, refreshSilent = true } = options;
  const queue = getQueue();

  if (!queue.length) {
    updateOfflineIndicator();
    return false;
  }
  if (!canProcessQueue() || isProcessingQueue) {
    updateOfflineIndicator();
    return false;
  }

  isProcessingQueue = true;
  isSyncing = true;

  let syncedAny = false;
  let blockedByServer = false;
  let shouldRefresh = false;
  let shouldShowSuccessToast = false;
  let shouldShowErrorToast = false;

  try {
    let remaining = [];

    if (isSupabaseReady()) {
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        try {
          if (item.action === 'delete_task') {
            await window.SUPABASE.deleteTask(item.payload.id);
          } else if (item.action === 'start_delay' || item.action === 'finish_delay') {
            await window.SUPABASE.saveDelay(item.payload);
          } else {
            await window.SUPABASE.saveTask(item.payload.task);
          }
          syncedAny = true;
        } catch (error) {
          if (isNetworkError(error)) {
            remaining.push(...queue.slice(i));
            break;
          }
          console.error('Error en cola Supabase', item, error);
          remaining.push(...queue.slice(i));
          blockedByServer = true;
          break;
        }
      }
    } else {
      try {
        await postAction({ action: 'batch_process', batch: queue });
        syncedAny = true;
      } catch (error) {
        if (isSessionError(error)) {
          remaining = queue;
          handleSessionExpired('Tu sesion vencio antes de sincronizar cambios pendientes.');
        } else if (isNetworkError(error)) {
          remaining = queue;
        } else {
          console.error('Error sincronizando lote de cambios pendientes', error);
          remaining = queue;
          blockedByServer = true;
        }
      }
    }

    saveQueue(remaining);
    updateOfflineIndicator();
    invalidateCache(CACHE_KEYS.tasks);

    if (!remaining.length && syncedAny) {
      shouldRefresh = refreshAfter && !!App.currentUser;
      shouldShowSuccessToast = !silent;
    } else if (blockedByServer && !silent) {
      shouldShowErrorToast = true;
    }
  } finally {
    isProcessingQueue = false;
    isSyncing = false;
    if (syncedAny) syncDoneAt = Date.now();
    if (window.__supabasePendingRefresh) {
      window.__supabasePendingRefresh = false;
      loadTaskData(true);
    }
  }

  if (shouldRefresh) {
    await new Promise(resolve => setTimeout(resolve, SYNC_COOLDOWN));
    syncDoneAt = 0;
    await loadTaskData(refreshSilent, true);
  }

  if (shouldShowSuccessToast) toast('Todo sincronizado');
  if (shouldShowErrorToast) toast('Hay cambios pendientes que no se pudieron subir');

  return syncedAny;
}

window.addEventListener('online', () => {
  toast('Conexion restaurada - sincronizando...');
  processQueue({ refreshAfter: true }).catch(e => {
    console.warn('Error processing queue after reconnect:', e);
    toast('Error al sincronizar cambios pendientes');
  });
});

window.addEventListener('offline', () => {
  toast('Sin conexion - los cambios se guardan localmente');
});

function invalidateCache(cacheKey) {
  localStorage.removeItem(cacheKey);
}

function getCache(key, ttlMs = 300000) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry._ts > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ _ts: Date.now(), data }));
  } catch (e) {
    console.warn('Cache storage failed', e);
  }
}

function saveTasksToCache() {
  if (typeof syncTaskSignature === 'function') syncTaskSignature();
  localStorage.setItem(CACHE_KEYS.tasks, JSON.stringify({ timestamp: Date.now(), data: App.tasks }));
}

function getDataSourceErrorMessage(error, fallback = 'No se pudo conectar con el servidor de datos') {
  const msg = String(error?.message || '').trim();
  const lower = msg.toLowerCase();
  // El backend activo decide el texto: culpar siempre a Google Sheets ocultaba
  // fallas reales de Supabase (p. ej. proyecto inexistente o tablas faltantes).
  const onSupabase = isSupabaseReady();
  const fuente = onSupabase ? 'Supabase' : 'Google Sheets';
  const revisa = onSupabase
    ? 'Verifica la conexion y que el proyecto de Supabase siga activo.'
    : 'Verifica la conexion y el estado del Apps Script publicado.';

  if (lower.includes('timeout')) {
    return fuente + ' esta respondiendo lento. Espera unos segundos y vuelve a intentar.';
  }

  // Tabla ausente en Supabase (PostgREST): el esquema no fue creado todavia.
  if (onSupabase && (lower.includes('schema cache') || lower.includes('pgrst205'))) {
    return 'Faltan las tablas en Supabase. Ejecuta scripts/setup.sql en el SQL Editor del proyecto.';
  }

  const isFetchError = !msg ||
    lower.includes('failed to fetch') ||
    lower.includes('load failed') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('http 404') ||
    lower.includes('timeout');

  if (window.location.protocol === 'file:') {
    return 'No se pudo cargar la lista desde ' + fuente + '. Verifica tu conexion a internet. ' + revisa;
  }

  if (isFetchError) {
    return 'No se pudo cargar la lista desde ' + fuente + '. ' + revisa;
  }

  return msg || fallback;
}

async function postAction(payload) {
  if (!API_BASE) throw new Error('No hay un endpoint configurado para Google Sheets');

  const requestPayload = {
    ...payload,
    _key: APP_DATA_KEY,
    _uid: App.currentUser?.id || '',
    _token: App.sessionToken || ''
  };

  const body = JSON.stringify(requestPayload);

  try {
    const res = await fetchWithTimeout(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      cache: 'no-store',
      body
    }, payload.action === 'login' ? 15000 : WRITE_REQUEST_TIMEOUT_MS);

    const text = await res.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { status: res.ok ? 'ok' : 'error', raw: text };
    }

    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    if (data.status === 'error') throw new Error(data.message || 'Error del servidor');
    return data;
  } catch (error) {
    if (payload.action !== 'login' && isSessionError(error)) {
      handleSessionExpired(error.message);
    }
    throw error || new Error('No se pudo conectar con el origen de datos');
  }
}

async function cachedFetch(resource, cacheKey, ttlMs = 300000, options = {}) {
  const forceFresh = options.forceFresh || ttlMs <= 0;
  let staleEntry = null;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      staleEntry = JSON.parse(cached);
      if (!forceFresh && Date.now() - staleEntry.timestamp < ttlMs) return staleEntry.data;
    } catch {
      staleEntry = null;
    }
  }

  const query = { ...(options.query || {}) };
  if (forceFresh) query._ts = Date.now();

  try {
    const url = buildApiUrl(resource, query);
    const res = await fetchWithTimeout(url, {
      cache: forceFresh ? 'no-store' : 'default'
    }, options.timeoutMs || DEFAULT_REQUEST_TIMEOUT_MS);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data && data.status === 'error') throw new Error(data.message || 'Error del servidor');

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (cacheError) {
      console.warn(`No se pudo guardar cache para ${resource}`, cacheError);
    }

    return data;
  } catch (error) {
    if (staleEntry && staleEntry.data != null && isNetworkError(error)) {
      console.warn(`Usando cache vencido para ${resource}`, error);
      return staleEntry.data;
    }
    throw error;
  }
}

async function syncTask(task, action = 'save_task') {
  isSyncing = true;

  try {
    if (isSupabaseReady()) {
      if (action === 'delete_task') {
        await window.SUPABASE.deleteTask(task.id);
      } else {
        await window.SUPABASE.saveTask(task);
      }
    } else {
      if (action === 'delete_task') {
        await postAction({ action: 'delete_task', id: task.id });
      } else {
        await postAction({ action: 'save_task', task: serializeTask(task) });
      }
    }
    invalidateCache(CACHE_KEYS.tasks);
  } catch (error) {
    if (isNetworkError(error)) {
      const payload = action === 'delete_task'
        ? { id: task.id }
        : { task: serializeTask(task) };
      addToQueue(action, payload);
      updateOfflineIndicator();
      return;
    }
    throw error;
  } finally {
    isSyncing = false;
    syncDoneAt = Date.now();
    // Si el RTC se saltó durante el sync, refrescar ahora
    if (window.__supabasePendingRefresh) {
      window.__supabasePendingRefresh = false;
      loadTaskData(true);
    }
  }
}

async function syncDelayAction(action, payload) {
  isSyncing = true;

  try {
    if (isSupabaseReady() && (action === 'start_delay' || action === 'finish_delay')) {
      const delay = await window.SUPABASE.saveDelay(payload);
      invalidateCache(CACHE_KEYS.tasks);
      return { status: 'saved', delay };
    }
    const data = await postAction({ action, ...payload });
    invalidateCache(CACHE_KEYS.tasks);
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      addToQueue(action, payload);
      updateOfflineIndicator();
      return { queued: true };
    }
    throw error;
  } finally {
    isSyncing = false;
    syncDoneAt = Date.now();
  }
}

async function loadUsers(silent = false) {
  if (isLoadingUsers) return;
  isLoadingUsers = true;
  App.usersLoadError = '';

  if (!silent) {
    App.usersLoading = true;
    initLogin();
    if (App.view === 'usr') renderUsers();
  }

  try {
    let parsedUsers = [];
    let brokenCache = false;

    if (isSupabaseReady()) {
      const data = await window.SUPABASE.loadUsers();
      parsedUsers = data || [];
    } else {
      let data;
      let freshRetry = false;

      while (true) {
        data = await cachedFetch('usuarios', CACHE_KEYS.users, freshRetry ? 0 : 15000, {
          forceFresh: freshRetry,
          timeoutMs: USERS_REQUEST_TIMEOUT_MS,
          query: freshRetry ? { fresh: '1' } : null
        });

        if (Array.isArray(data) && data.length === 0 && !freshRetry) {
          invalidateCache(CACHE_KEYS.users);
          freshRetry = true;
          continue;
        }

        parsedUsers = Array.isArray(data)
          ? data.map(normalizeUserRecord).filter(Boolean)
          : [];

        const invalidPayload = !Array.isArray(data) || (data.length && !parsedUsers.length);
        if (invalidPayload && !freshRetry) {
          invalidateCache(CACHE_KEYS.users);
          freshRetry = true;
          continue;
        }

        break;
      }

      if (!Array.isArray(data)) throw new Error('La hoja Usuarios no devolvio una lista valida');
      if (data.length && !parsedUsers.length) {
        throw new Error('La respuesta de usuarios no coincide con el formato esperado');
      }
    }

    users = parsedUsers;
    App.usersLoadError = '';

    initLogin();

    if (App.currentUser) {
      // Usuarios SSO (del Launcher) no existen en esta BD — no expulsar
      if (App.ssoAuthenticated) {
        updateSidebarUser();
        if (App.view === 'usr') renderUsers();
      } else {
        const fresh = activeUsers().find(user => user.id === App.currentUser.id);
        if (!fresh) {
          confirmLogout(true);
          toast('Tu sesion ya no esta disponible');
        } else {
          App.currentUser = fresh;
          updateSidebarUser();
          if (App.view === 'usr') renderUsers();
        }
      }
    } else {
      restoreSession();
    }
  } catch (error) {
    console.error('Error cargando usuarios', error);
    App.usersLoadError = 'No se pudo cargar la lista';
    if (!silent) {
      initLogin();
      showLoginError(getDataSourceErrorMessage(error));
      if (App.view === 'usr') renderUsers();
    }
  } finally {
    App.usersLoading = false;
    isLoadingUsers = false;
    initLogin();
    if (App.view === 'usr') renderUsers();
  }
}

async function loadTaskData(silent = false, force = false) {
  if (!App.currentUser) {
    App.tasks = [];
    hideLoaderOverlay();
    if (!silent) render();
    return;
  }
  if (isLoadingTasks) return;
  if (force && (isSyncing || Date.now() - syncDoneAt < SYNC_COOLDOWN)) return;

  isLoadingTasks = true;
  const previousTasks = Array.isArray(App.tasks) ? App.tasks.slice() : [];

  const loader = document.getElementById('loader');
  if (!silent && loader) {
    showLoaderOverlay({
      title: 'Actualizando panel operativo',
      detail: 'Sincronizando tareas, estados y novedades del calendario...',
      loginState: App.currentUser ? 'done' : 'active',
      loginText: App.currentUser ? 'Acceso listo' : 'Preparando acceso',
      opsState: 'active',
      opsText: force ? 'Trayendo cambios recientes' : 'Cargando actividades'
    });
  }

  try {
    let parsed = [];
    let parsedSignature = '';

    if (isSupabaseReady()) {
      parsed = await window.SUPABASE.loadTasks();
    } else {
      const data = await cachedFetch('tareas', CACHE_KEYS.tasks, force ? 0 : 300000, {
        forceFresh: force,
        timeoutMs: TASKS_REQUEST_TIMEOUT_MS
      });

      if (force && (isSyncing || Date.now() - syncDoneAt < SYNC_COOLDOWN)) return;

      parsed = Array.isArray(data) ? data.map(normalizeTaskRecord).filter(Boolean) : [];
    }
    // Unico punto donde se recorta la visibilidad: el resto de las vistas (calendario,
    // contadores, buscador, movil) parten de App.tasks y heredan el filtro solo.
    parsed = visibleTasksFor(parsed, App.currentUser);
    parsedSignature = buildTaskListSignature(parsed);
    const shouldAutoFocusDay = !App.selectedDay || (
      App.selectedDay === todayKey() &&
      !parsed.some(t => t.dep === App.department && t.fecha === App.selectedDay)
    );

    try {
      if (silent) {
        if (App.tasksSignature !== parsedSignature) {
          App.tasks = parsed;
          App.tasksSignature = parsedSignature;
          if (shouldAutoFocusDay) ensureSelectedDayForDepartment(App.department, null);
          render();
        }
      } else {
        App.tasks = parsed;
        App.tasksSignature = parsedSignature;
        if (shouldAutoFocusDay) ensureSelectedDayForDepartment(App.department, null);
        render();
      }

      checkAndNotify();
    } catch (uiError) {
      console.error('Error renderizando tareas', uiError);
      if (!silent) toast('Las tareas se cargaron, pero hubo un problema al mostrarlas');
    }
  } catch (error) {
    console.error('Error cargando tareas', error);
    if (!silent) {
      App.tasks = previousTasks;
      render();
      toast(getDataSourceErrorMessage(
        error,
        previousTasks.length ? 'No se pudieron actualizar las tareas' : 'No se pudieron cargar las tareas'
      ));
    } else if (!previousTasks.length) {
      toast('Error al cargar datos iniciales');
    }
  } finally {
    isLoadingTasks = false;
    if (!silent) hideLoaderOverlay();
    if (typeof updateLastSyncStatus === 'function') updateLastSyncStatus();
  }
}
