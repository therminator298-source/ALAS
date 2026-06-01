const NOTIF_KEY  = 'ALAS_NOTIF_STORE_V1';
const NOTIF_MAX  = 60;
const NOTIF_DAYS = 7;

function getStoredNotifs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return []; }
}
function saveStoredNotifs(list) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
}

function playNotifSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    [[659, 0, 0.11], [880, 0.11, 0.28]].forEach(([freq, start, end]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + end + 0.05);
    });
    setTimeout(() => { try { ctx.close(); } catch(e) {} }, 600);
  } catch(e) {}
}

function addNotification({ type, task, message }) {
  const list       = getStoredNotifs();
  const twoHrsAgo  = Date.now() - 7_200_000;
  const dup = list.find(n =>
    !n.read && n.type === type && n.taskId === task.id &&
    new Date(n.ts).getTime() > twoHrsAgo
  );
  if (dup) return;

  list.unshift({
    id:        generateId(),
    type,
    taskId:    task.id,
    taskTipo:  task.tipo,
    taskObs:   task.obs || '',
    taskDep:   task.dep,
    taskFecha: task.fecha,
    message,
    ts:        new Date().toISOString(),
    read:      false
  });

  const cutoff = Date.now() - NOTIF_DAYS * 86_400_000;
  const pruned = list
    .filter(n => new Date(n.ts).getTime() > cutoff)
    .slice(0, NOTIF_MAX);

  saveStoredNotifs(pruned);
  updateBellBadge();
}

function getUnreadCount() {
  return getStoredNotifs().filter(n => !n.read).length;
}

function updateBellBadge() {
  const cnt   = getUnreadCount();
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  badge.style.display = cnt > 0 ? 'flex' : 'none';
  badge.textContent   = cnt > 99 ? '99+' : String(cnt);
}

function markAllRead() {
  saveStoredNotifs(getStoredNotifs().map(n => ({ ...n, read: true })));
  updateBellBadge();
  renderNotifPanel();
}

function purgeReadNotifs() {
  saveStoredNotifs(getStoredNotifs().filter(n => !n.read));
  updateBellBadge();
}

function removeNotif(id) {
  saveStoredNotifs(getStoredNotifs().filter(n => n.id !== id));
  updateBellBadge();
  renderNotifPanel();
}

function markNotifRead(id) {
  saveStoredNotifs(getStoredNotifs().map(n => n.id === id ? { ...n, read: true } : n));
  updateBellBadge();
}

function notifTimeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return 'hace un momento';
  if (diff < 3600)  return 'hace ' + Math.floor(diff / 60) + 'm';
  if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + 'h';
  return 'hace ' + Math.floor(diff / 86400) + 'd';
}

function notifIconCfg(type) {
  const flag  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
  const clock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  const play  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  const check = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const cfg   = {
    prio:    { svg: flag,  color: '#ef4444', bg: 'rgba(239,68,68,.12)'    },
    overdue: { svg: clock, color: '#f59e0b', bg: 'rgba(245,158,11,.12)'   },
    started: { svg: play,  color: '#3b82f6', bg: 'rgba(59,130,246,.12)'   },
    done:    { svg: check, color: '#10b981', bg: 'rgba(16,185,129,.12)'   }
  };
  return cfg[type] || cfg.done;
}

function renderNotifPanel() {
  const listEl   = document.getElementById('notifList');
  const markBtn  = document.getElementById('notifMarkAll');
  if (!listEl) return;

  const notifs = getStoredNotifs();
  const unread = notifs.filter(n => !n.read).length;
  if (markBtn) markBtn.style.visibility = unread > 0 ? 'visible' : 'hidden';

  if (!notifs.length) {
    const bellSVG = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    listEl.innerHTML = '<div class="notif-empty">' + bellSVG + '<p>Sin notificaciones</p></div>';
    return;
  }

  listEl.innerHTML = notifs.map(n => {
    const ico  = notifIconCfg(n.type);
    const tp   = findActivityType(n.taskTipo);
    const dep  = n.taskDep === 'deposito' ? 'Dep\u00f3sito' : 'F\u00e1brica';
    const time = notifTimeAgo(n.ts);
    const obs  = n.taskObs ? '<div class="notif-obs">' + esc(n.taskObs) + '</div>' : '';
    return '<div class="notif-item' + (n.read ? '' : ' unread') + '" onclick="notifGoTo(\'' + n.id + '\',\'' + n.taskFecha + '\',\'' + n.taskDep + '\')">'
      + '<div class="notif-ico" style="background:' + ico.bg + ';color:' + ico.color + '">' + ico.svg + '</div>'
      + '<div class="notif-body">'
      + '<div class="notif-msg">' + esc(n.message) + '</div>'
      + '<div class="notif-meta">'
      + '<span style="color:' + tp.c + ';font-weight:600">' + tp.nm + '</span>'
      + '<span class="notif-sep"> - </span>' + dep
      + '<span class="notif-sep"> - </span>' + time
      + '</div>'
      + obs
      + '</div>'
      + (!n.read ? '<span class="notif-dot"></span>' : '')
      + '</div>';
  }).join('');
}

function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  if (panel.style.display === 'none') {
    panel.style.display = 'flex';
    markAllRead();
  } else {
    closeNotifPanel();
  }
}

function closeNotifPanel() {
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  panel.style.display = 'none';
  purgeReadNotifs();
}

function notifGoTo(notifId, fecha, dep) {
  removeNotif(notifId);
  closeNotifPanel();
  const [y, m] = fecha.split('-').map(Number);
  App.year       = y;
  App.month      = m - 1;
  App.selectedDay = fecha;
  App.department  = dep;
  const bf = document.getElementById('btnDepFabrica');
  const bd = document.getElementById('btnDepDeposito');
  if (bf) bf.classList.toggle('on', dep === 'fabrica');
  if (bd) bd.classList.toggle('on', dep === 'deposito');
  setView('cal');
}

document.addEventListener('click', e => {
  const wrapper = document.getElementById('notifWrapper');
  if (wrapper && !wrapper.contains(e.target)) closeNotifPanel();
});

function getNotifiedSet() {
  const key = 'ALAS_NOTIF_' + todayKey();
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}

function saveNotifiedSet(s) {
  localStorage.setItem('ALAS_NOTIF_' + todayKey(), JSON.stringify([...s]));
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch {}
  }
}

function checkAndNotify() {
  if (!App.currentUser) return;

  const today    = todayKey();
  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const notified = getNotifiedSet();
  const toNotify = [];

  App.tasks.forEach(t => {
    if (t.estado === 'terminado') return;
    if (notified.has(t.id))      return;

    if (t.prio && t.fecha <= today) {
      toNotify.push({ task: t, type: 'prio' });
      return;
    }
    if (t.estado === 'pendiente' && t.fecha === today && t.hi) {
      const [h, m] = t.hi.split(':').map(Number);
      if (!isNaN(h) && (h * 60 + m) < nowMins - 15) {
        toNotify.push({ task: t, type: 'overdue' });
      }
    }
  });

  toNotify.forEach(({ task, type }) => {
    const tp      = findActivityType(task.tipo);
    const message = type === 'prio'
      ? 'Alta prioridad: ' + tp.nm
      : 'Tarea vencida: ' + tp.nm;

    addNotification({ type, task, message });

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(
          type === 'prio' ? 'Prioridad: ' + message : 'Recordatorio: ' + message,
          { body: task.obs || 'Fecha: ' + task.fecha, icon: './assets/logo.jpeg', tag: task.id }
        );
      } catch {}
    }

    notified.add(task.id);
  });

  if (toNotify.length) saveNotifiedSet(notified);
}
