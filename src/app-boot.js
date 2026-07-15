// ============================================================
//  ALAS Fábrica — app-boot.js
//  Arranque y timers
// ============================================================

function updateConnectionStatus() {
  const el = document.getElementById('offlineIndicator');
  if (!el) return;
  if (navigator.onLine) {
    el.classList.add('online');
    el.querySelector('svg')?.setAttribute('opacity', '0.5');
  } else {
    el.classList.remove('online');
    el.querySelector('svg')?.setAttribute('opacity', '1');
  }
}

async function bootstrap() {
  showLoaderOverlay({
    title: 'Iniciando tablero operativo',
    detail: 'Precargando acceso, usuarios y entorno de trabajo...',
    loginState: 'active',
    loginText: 'Cargando lista de usuarios',
    opsState: 'pending',
    opsText: 'Preparando calendario y panel'
  });
  
  // Failsafe: Garantizar que el loader no se quede pegado mÃ¡s de 8 segundos pase lo que pase.
  // Removed artificial 8s hide limit
  updateSidebarUser();
  updateOfflineIndicator();
  updateBellBadge();
  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  App.usersLoading = true;
  installClientGuards();
  initLogin();

  document.getElementById('loginPin')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doLogin(); }
  });
  document.getElementById('loginPin')?.addEventListener('input', () => {
    if (App.loginPinState === 'error') {
      setLoginPinStatus('neutral', 'Ingresa tu PIN de administrador');
    }
    showLoginError('');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && App.reorderPickId) {
      clearEnProcesoReorderState();
    }
  });
  document.addEventListener('click', e => {
    if (!App.reorderPickId) return;
    const list = document.getElementById('enProcesoList');
    if (list && !list.contains(e.target)) {
      clearEnProcesoReorderState(list);
    }
  }, true);

  try { await loadUsers(false); } catch (e) {
    console.warn('Error loading users on boot:', e);
  }

  // SSO opcional: si viene con token del Launcher, entra directo y se saltea el
  // login. Si no, NO se rebota: el modulo es de acceso abierto por enlace directo.
  if (typeof initSSO === 'function') {
    await initSSO();
  }

  if (App.currentUser) {
    setLoaderOverlayState({
      title: 'Sincronizando operaciones',
      detail: 'Recuperando tareas, tablero y estado actual de la jornada...',
      loginState: 'done',
      loginText: 'Sesion restaurada',
      opsState: 'active',
      opsText: 'Cargando tareas y resumen'
    });
    const hadPendingQueue = hasPendingQueue();
    try {
      const flushedQueue = await processQueue({ silent: true, refreshAfter: true, refreshSilent: false });
      if (!hadPendingQueue || !flushedQueue) {
        await loadTaskData(false, hadPendingQueue ? false : true);
      }
    } catch (e) {
      console.warn('Error during boot sync:', e);
      toast('Error al sincronizar datos iniciales');
    }

    // ALASMotionBridge — animar entrada del app-container cuando los datos están listos
    if (typeof window.ALASTransition !== 'undefined') {
      ALASTransition.enterProject();
    }
  } else {
    // Sin sesion SSO: antes se rebotaba al Launcher, lo que impedia entrar por
    // enlace directo. Ahora se baja el loader y queda a la vista el login local
    // (la lista de usuarios, que ya esta en el DOM y no pide PIN).
    hideLoaderOverlay();
    if (typeof window.ALASTransition !== 'undefined') {
      ALASTransition.enterProject();
    }
  }
}

async function refreshLiveData() {
  if (document.hidden || !App.currentUser || isSyncing) return;
  try {
    if (hasPendingQueue()) {
      await processQueue({ silent: true, refreshAfter: true });
      return;
    }
    await loadTaskData(true, true);
  } catch (e) {
    console.warn('Error refreshing live data:', e);
  }
}

// Suscripción en tiempo real via Supabase (reemplaza el polling)
if (isSupabaseReady()) {
  const sub = window.SUPABASE.subscribeToTasks((payload) => {
    if (document.hidden || !App.currentUser) return;
    // Si estamos sincronizando, no pisar el estado optimista
    if (isSyncing) { window.__supabasePendingRefresh = true; return; }
    loadTaskData(true);
  });
  window.__supabaseSub = sub;
  window.addEventListener('beforeunload', () => {
    window.SUPABASE.closeChannel(window.__supabaseSub);
  });
}

bootstrap();

// Escuchar cambios desde otras pestañas
try {
  SYNC_CHANNEL.addEventListener('message', (e) => {
    if (e.data === 'data_changed' && !document.hidden && App.currentUser) {
      loadTaskData(true, true);
    }
  });
} catch (e) {}

setInterval(() => { refreshLiveData(); }, TASKS_POLL_INTERVAL);
setInterval(() => { if (!document.hidden) checkAndNotify(); }, 60000);
setInterval(() => { if (!document.hidden) loadUsers(true);  }, 60000);
setInterval(() => updateLastSyncStatus(), 5000);
setInterval(() => {
  if (document.hidden || !hasPendingQueue()) return;
  processQueue({ silent: true, refreshAfter: true }).catch(e => {
    console.warn('Error processing queue (interval):', e);
  });
}, 15000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshLiveData();
});
