// ============================================================
//  ALAS fabrica — app-mobile.js
//  Sección extraída de shell mobile
// ============================================================

const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;

function renderChunked(items, renderFn, container, chunkSize = 20, delay = 8) {
  if (!container || !items.length) return;
  let idx = 0;
  function nextChunk() {
    const end = Math.min(idx + chunkSize, items.length);
    let html = '';
    while (idx < end) {
      html += renderFn(items[idx], idx);
      idx++;
    }
    container.insertAdjacentHTML('beforeend', html);
    if (idx < items.length) requestAnimationFrame(() => setTimeout(nextChunk, delay));
  }
  container.innerHTML = '';
  requestAnimationFrame(nextChunk);
}

function renderChunkedIfLarge(items, renderFn, container, threshold = 40) {
  if (items.length > threshold) {
    renderChunked(items, renderFn, container);
  } else {
    container.innerHTML = items.map((t, i) => renderFn(t, i)).join('');
  }
}

const mob = {
  tab:          'cal',
  filter:       'todos',
  userFilter:   'todos',
  typeFilter:   'todos',
  _ntkStep:     1,
  _editId:      null,
  _delayTaskId: null,
  ntkData:      { tipo:'', prio:false, fecha:'', hi:'', asig:'', obs:'' }
};

function mob_init() {
  if (!IS_MOBILE) return;
  const oldFab = document.getElementById('fabBtn');
  if (oldFab) oldFab.style.display = 'none';

  let touchStartY = 0;
  let isPulling = false;

  window.addEventListener('touchstart', e => {
    if (window.scrollY <= 0) {
      touchStartY = e.touches[0].clientY;
      isPulling = true;
    } else {
      isPulling = false;
    }
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!isPulling) return;
    const y = e.touches[0].clientY;
    if (y - touchStartY > 100 && window.scrollY <= 0) {
      isPulling = false;
      if (typeof toast === 'function') toast('Actualizando datos...');
      if (typeof loadTaskData === 'function') loadTaskData(true, true);
    }
  }, { passive: true });
}

function mob_render() {
  if (!IS_MOBILE) return;
  ensureMobileSelectedDay();
  mob_renderHeader();
  mob_renderStats();
  mob_renderDayStrip();
  mob_renderFilterRow();
  mob_renderTaskList();
  mob_syncNotifDot();
  if (mob.tab === 'res') mob_renderResumen();
  if (mob.tab === 'usr') mob_renderUsers();
}

function mob_renderHeader() {
  const u = App.currentUser;
  if (!u) return;
  const nm = u.nm || u.nombre || 'Usuario';
  const firstName = String(nm).trim().split(/\s+/)[0] || nm;

  const nameEl = document.getElementById('mobUserName');
  if (nameEl) nameEl.textContent = firstName;

  const toggle  = document.querySelector('.mob-dept-toggle');
  const deptEl  = document.getElementById('mobUserDept');
  const deptNm  = App.department === 'deposito' ? 'deposito' : 'fabrica';

  if (u.rol !== 'admin') {
    App.department = (u.dep === 'deposito') ? 'deposito' : 'fabrica';
    if (toggle)  toggle.style.display  = 'none';
    if (deptEl) { deptEl.style.display = ''; deptEl.textContent = deptNm; }
  } else {
    if (toggle)  toggle.style.display  = '';
    if (deptEl)  deptEl.style.display  = 'none';
    document.getElementById('mobBtnfabrica')?.classList.toggle('on', App.department === 'fabrica');
    document.getElementById('mobBtndeposito')?.classList.toggle('on', App.department === 'deposito');
  }

  const navUsr = document.getElementById('mobNavUsr');
  if (navUsr) navUsr.style.display = u.rol === 'admin' ? 'flex' : 'none';
}

function mob_deptMatch(t) {
  return App.department === 'deposito' ? t.dep === 'deposito' : t.dep === 'fabrica';
}

function mob_dayTasks() {
  return App.tasks.filter(t => t.fecha === App.selectedDay && mob_deptMatch(t));
}

function ensureMobileSelectedDay() {
  if (!IS_MOBILE || App.selectedDay) return;
  const fallback = App.tasks.find(t => mob_deptMatch(t))?.fecha || todayKey();
  focusCalendarDate(fallback);
}

function focusCalendarDate(fecha) {
  if (!fecha) return;
  const parts = String(fecha).split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return;
  App.year = parts[0];
  App.month = parts[1] - 1;
  App.selectedDay = fecha;
}

function mob_resetViewFilters() {
  mob.filter = 'todos';
  mob.userFilter = 'todos';
  mob.typeFilter = 'todos';
}

function mob_taskMatchesFilters(task) {
  if (!task || !mob_deptMatch(task) || task.fecha !== App.selectedDay) return false;
  if (mob.userFilter !== 'todos' && task.asig !== mob.userFilter) return false;
  if (mob.typeFilter !== 'todos' && task.tipo !== mob.typeFilter) return false;
  if (mob.filter === 'prio') return !!task.prio && task.estado !== 'terminado';
  if (mob.filter !== 'todos' && task.estado !== mob.filter) return false;
  return true;
}

function mob_revealTask(task, forceResetFilters = false) {
  if (!task) return;
  focusCalendarDate(task.fecha || todayKey());
  if (forceResetFilters || !mob_taskMatchesFilters(task)) {
    mob_resetViewFilters();
  }
}

function mob_captureViewState() {
  return {
    year: App.year,
    month: App.month,
    selectedDay: App.selectedDay,
    filter: mob.filter,
    userFilter: mob.userFilter,
    typeFilter: mob.typeFilter
  };
}

function mob_restoreViewState(state) {
  if (!state) return;
  App.year = state.year;
  App.month = state.month;
  App.selectedDay = state.selectedDay;
  mob.filter = state.filter;
  mob.userFilter = state.userFilter;
  mob.typeFilter = state.typeFilter;
}

function mob_formatDaySubtitle(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dow = DAYS[new Date(y, m - 1, d).getDay()];
  return `${dow}, ${d} de ${String(MONTHS[m - 1] || '').toLowerCase()}`;
}

function mob_shortUserLabel(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

function mob_taskTimeLabel(task) {
  if (!task?.hi) return '';
  return task.hf ? `${task.hi} - ${task.hf}` : task.hi;
}

function mob_getScopedDayTasks() {
  let tasks = mob_dayTasks();
  if (mob.userFilter !== 'todos') tasks = tasks.filter(t => t.asig === mob.userFilter);
  if (mob.typeFilter !== 'todos') tasks = tasks.filter(t => t.tipo === mob.typeFilter);
  return tasks;
}

function mob_getVisibleEnProcesoIds() {
  return mob_getScopedDayTasks()
    .filter(t => t.estado === 'en_proceso')
    .slice()
    .sort(compareEnProcesoOrder)
    .map(t => t.id);
}

function mob_toggleReorder(taskId) {
  mob_openTaskDetail(taskId);
  toast('Elige el orden en el detalle');
}

function mob_setTaskOrder(taskId, rawPosition) {
  const appliedPosition = setTaskEnProcesoOrder(taskId, rawPosition);
  if (!appliedPosition) return;

  App.reorderPickId = null;
  mob_renderTaskList();
  mob_openTaskDetail(taskId);
  toast(`Orden ${appliedPosition} guardado`);
}

function mob_renderStats() {
  const tasks = mob_dayTasks();
  const pend  = tasks.filter(t => t.estado === 'pendiente').length;
  const prog  = tasks.filter(t => t.estado === 'en_proceso').length;
  const done  = tasks.filter(t => t.estado === 'terminado').length;
  const prio  = tasks.filter(t => t.prio && t.estado !== 'terminado').length;
  const g = id => document.getElementById(id);
  if (g('mobStatTotal')) g('mobStatTotal').textContent = tasks.length;
  if (g('mobStatPend'))  g('mobStatPend').textContent  = pend;
  if (g('mobStatProg'))  g('mobStatProg').textContent  = prog;
  if (g('mobStatDone'))  g('mobStatDone').textContent  = done;
  if (g('mobStatPrio'))  g('mobStatPrio').textContent  = prio;
  const chipKeys = ['todos','pendiente','en_proceso','terminado','prio'];
  document.querySelectorAll('#mobStats .mob-stat-chip').forEach((c, i) => {
    c.classList.toggle('on', chipKeys[i] === mob.filter);
  });
}

function mob_renderDayStrip() {
  const strip = document.getElementById('mobDayStrip');
  const lbl   = document.getElementById('mobMonthLabel');
  if (!strip) return;
  ensureMobileSelectedDay();
  const y = App.year, mo = App.month;
  if (lbl) lbl.innerHTML = `<span class="mob-month-main">${MONTHS[mo]}</span><span class="mob-month-year">${y}</span>`;
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const today       = todayKey();
  const dowNames    = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  let html = '';
  for (let d = 1; d <= daysInMonth; d++) {
    const key       = `${y}-${pad2(mo+1)}-${pad2(d)}`;
    const dow       = new Date(y, mo, d).getDay();
    const dayTasks  = App.tasks.filter(t => t.fecha === key && mob_deptMatch(t));
    const isToday   = key === today;
    const isSel     = key === App.selectedDay;
    const dots      = dayTasks.slice(0, 3).map(t => {
      const tp = findActivityType(t.tipo);
      return `<span class="mob-day-dot" style="background:${tp.c}"></span>`;
    }).join('');
    const cls = `mob-day-cell${isSel ? ' selected' : isToday ? ' today' : ''}`;
    html += `<div class="${cls}" onclick="mob_selectDay('${key}')">
      <span class="mob-day-dow">${dowNames[dow]}</span>
      <span class="mob-day-num">${d}</span>
      <div class="mob-day-dots">${dots}</div>
    </div>`;
  }
  strip.innerHTML = html;
  requestAnimationFrame(() => {
    if (!App.selectedDay) return;
    const selD  = parseInt(App.selectedDay.split('-')[2]) - 1;
    const cells = strip.querySelectorAll('.mob-day-cell');
    if (cells[selD]) cells[selD].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
}

function mob_selectDay(key) {
  App.selectedDay = key;
  mob.filter = 'todos';
  mob_renderDayStrip();
  mob_renderStats();
  mob_renderTaskList();
}

function mob_goToday() {
  focusCalendarDate(todayKey());
  mob.filter = 'todos';
  mob_render();
}

function mob_renderTaskCard(task) {
  const tp = findActivityType(task.tipo);
  const u = findUser(task.asig);
  const enProcesoOrder = task.estado === 'en_proceso'
    ? Math.max(1, getEnProcesoOrderIdsForTask(task).indexOf(task.id) + 1)
    : null;
  const orderTag = enProcesoOrder
    ? `<span class="mob-tk-order-pill" title="Posicion ${enProcesoOrder}">#${enProcesoOrder}</span>`
    : '';
  const typeIcon = tp.i ? `<span class="mob-tk-type-ico">${tp.i}</span>` : '';
  const prioTag = task.prio ? `<span class="mob-tk-top-flag prio">Prioridad</span>` : '';
  const timeTag = task.hi
    ? `<span class="mob-tk-meta-chip time"><span class="mob-tk-meta-ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg></span><span>${esc(mob_taskTimeLabel(task))}</span></span>`
    : '';
  const userTag = u
    ? `<span class="mob-tk-meta-chip user"><span class="mob-tk-user-mini" style="background:${colorFromId(u.id || u.nm)}">${initials(u.nm)}</span><span class="mob-tk-meta-name">${esc(mob_shortUserLabel(u.nm))}</span></span>`
    : '';

  const delayMeta = getTaskDelayMeta(task);
  let actionBtn = '';
  if (task.estado === 'pendiente') {
    actionBtn = `<button class="mob-tk-action-btn iniciar" onclick="event.stopPropagation();mob_changeStatus('${task.id}','en_proceso')">Iniciar</button>`;
  } else if (task.estado === 'en_proceso') {
    actionBtn = delayMeta.active
      ? `<button class="mob-tk-action-btn delay" onclick="event.stopPropagation();mob_openDelay('${task.id}')">Cerrar demora</button>`
      : `<button class="mob-tk-action-btn finalizar" onclick="event.stopPropagation();mob_changeStatus('${task.id}','terminado')">Finalizar</button>`;
  } else if (task.estado === 'terminado') {
    actionBtn = `<span class="mob-tk-action-check" aria-label="Terminada"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>`;
  }

  const delayChip = delayMeta.badgeText
    ? `<span class="mob-tk-top-flag delay" title="${esc(delayMeta.badgeText)}">${esc(delayMeta.badgeText)}</span>`
    : '';
  return `<div class="mob-tk" onclick="mob_openTaskDetail('${task.id}')" style="--task-color:${tp.c};">
    <div class="mob-tk-top">
      <div class="mob-tk-top-left">${orderTag}<span class="mob-tk-type-pill" style="--task-color:${tp.c};">${typeIcon}<span>${tp.nm}</span></span></div>
      <div class="mob-tk-top-chips">${delayChip}${prioTag}</div>
    </div>
    <div class="mob-tk-body">
      <div class="mob-tk-obs">${esc(task.obs) || '--'}</div>
      <div class="mob-tk-footer">
        <div class="mob-tk-meta">${timeTag}${userTag}</div>
        ${actionBtn ? `<div class="mob-tk-btns">${actionBtn}</div>` : ''}
      </div>
    </div>
  </div>`;
}

function mob_renderTaskList() {
  const listEl  = document.getElementById('mobTaskList');
  const titleEl = document.getElementById('mobDayTitle');
  const subtitleEl = document.getElementById('mobDaySubtitle');
  const countEl = document.getElementById('mobTaskCount');
  const progressEl = document.getElementById('mobDayProgress');
  if (!listEl) return;
  ensureMobileSelectedDay();
  if (!App.selectedDay) return;

  let scopedTasks = mob_getScopedDayTasks();

  let tasks = scopedTasks.slice();
  if (mob.filter === 'prio') {
    tasks = tasks.filter(t => t.prio && t.estado !== 'terminado');
  } else if (mob.filter !== 'todos') {
    tasks = tasks.filter(t => t.estado === mob.filter);
  }

  tasks.sort((a, b) => {
    if (mob.filter === 'en_proceso') return compareEnProcesoOrder(a, b);
    if (a.estado === 'en_proceso' && b.estado === 'en_proceso') return compareEnProcesoOrder(a, b);
    if (b.prio !== a.prio) return b.prio ? 1 : -1;
    return (a.hi || '').localeCompare(b.hi || '');
  });

  const totalCount = scopedTasks.length;
  const pendingCount = scopedTasks.filter(t => t.estado === 'pendiente').length;
  const progressCount = scopedTasks.filter(t => t.estado === 'en_proceso').length;
  const doneCount = scopedTasks.filter(t => t.estado === 'terminado').length;
  const prioCount = scopedTasks.filter(t => t.prio && t.estado !== 'terminado').length;
  const progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  if (titleEl) {
    const [sy, sm, sd] = App.selectedDay.split('-').map(Number);
    titleEl.textContent = App.selectedDay === todayKey() ? 'Hoy' : DAYS[new Date(sy, sm - 1, sd).getDay()];
  }
  if (subtitleEl) subtitleEl.textContent = mob_formatDaySubtitle(App.selectedDay);
  if (countEl) countEl.textContent = `${totalCount} tarea${totalCount !== 1 ? 's' : ''}`;
  if (progressEl) progressEl.textContent = `${progressPct}%`;

  const btns = document.querySelectorAll('#mobStatusRow .mob-sf-btn');
  const countsByStatus = {
    todos: totalCount,
    pendiente: pendingCount,
    en_proceso: progressCount,
    terminado: doneCount,
    prio: prioCount
  };
  btns.forEach(btn => {
    const key = btn.dataset.sf || 'todos';
    const baseLabel = btn.getAttribute('data-base-label') || btn.textContent.trim();
    btn.setAttribute('data-base-label', baseLabel);
    btn.classList.toggle('on', key === mob.filter);
    btn.innerHTML = `<span>${baseLabel}</span><span class="mob-sf-count">${countsByStatus[key] || 0}</span>`;
  });

  if (mob.filter !== 'en_proceso' || !tasks.some(t => t.id === App.reorderPickId && t.estado === 'en_proceso')) {
    App.reorderPickId = null;
  }

  const allDayTasks = mob_dayTasks();
  const hasHiddenTasks = allDayTasks.length > 0 && (mob.filter !== 'todos' || mob.userFilter !== 'todos' || mob.typeFilter !== 'todos');

  if (!tasks.length) {
    listEl.innerHTML = `<div class="mob-empty">
      <div class="mob-empty-icon">📋</div>
      <div class="mob-empty-text">${hasHiddenTasks ? 'Hay tareas ocultas por filtros' : 'Sin tareas para este día'}</div>
      ${hasHiddenTasks ? '<button class="mob-filter-clear" style="margin-top:10px;" onclick="mob_showAllTasks()">Ver todas</button>' : ''}
    </div>`;
    return;
  }

  renderChunkedIfLarge(tasks, (t, i) => mob_renderTaskCard(t), listEl);
}

function mob_renderFilterRow() {
  const el = document.getElementById('mobFilterRow');
  if (!el) return;

  const deptUsers = activeUsers().filter(u => {
    const d = u.dep || '';
    return d === App.department || d === 'admin' || u.rol === 'admin';
  });
  const deptTypes = ACTIVITY_TYPES.filter(a => a.dep.includes(App.department));
  const hasFilter = mob.userFilter !== 'todos' || mob.typeFilter !== 'todos';

  el.innerHTML = `<div class="mob-filter-bar">
    <select class="mob-filter-sel${mob.userFilter !== 'todos' ? ' active' : ''}" onchange="mob_setUserFilter(this.value)">
      <option value="todos">👤 Usuario</option>
      ${deptUsers.map(u => `<option value="${u.id}"${mob.userFilter === u.id ? ' selected' : ''}>${esc(u.nombre || u.nm || '')}</option>`).join('')}
    </select>
    <select class="mob-filter-sel${mob.typeFilter !== 'todos' ? ' active' : ''}" onchange="mob_setTypeFilter(this.value)">
      <option value="todos">📋 Tipo</option>
      ${deptTypes.map(a => `<option value="${a.id}"${mob.typeFilter === a.id ? ' selected' : ''}>${a.nm}</option>`).join('')}
    </select>
    ${hasFilter ? `<button class="mob-filter-clear" onclick="mob_clearFilters()">✕</button>` : ''}
  </div>`;
}

function mob_setUserFilter(uid) {
  mob.userFilter = uid;
  mob_renderFilterRow();
  mob_renderTaskList();
}

function mob_setTypeFilter(tipo) {
  mob.typeFilter = tipo;
  mob_renderFilterRow();
  mob_renderTaskList();
}

function mob_clearFilters() {
  mob.userFilter = 'todos';
  mob.typeFilter = 'todos';
  mob_renderFilterRow();
  mob_renderTaskList();
}

function mob_showAllTasks() {
  mob_resetViewFilters();
  mob_renderFilterRow();
  mob_renderStats();
  mob_renderTaskList();
}

function mob_openTaskDetail(id) {
  const task = App.tasks.find(t => t.id === id);
  if (!task) return;
  const tp      = findActivityType(task.tipo);
  const st      = STATUSES[task.estado] || STATUSES.pendiente;
  const u       = findUser(task.asig);
  const isAdmin = App.currentUser?.rol === 'admin';
  const fmtTS   = ts => { const d = new Date(ts); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  const orderIds = task.estado === 'en_proceso' ? getEnProcesoOrderIdsForTask(task) : [];
  const currentOrder = task.estado === 'en_proceso'
    ? Math.max(1, orderIds.indexOf(task.id) + 1)
    : null;
  const orderOptionCount = task.estado === 'en_proceso'
    ? Math.max(8, orderIds.length)
    : 0;
  const orderOptions = task.estado === 'en_proceso'
    ? Array.from({ length: orderOptionCount }, (_, idx) => {
        const position = idx + 1;
        return `<option value="${position}"${position === currentOrder ? ' selected' : ''}>${position}</option>`;
      }).join('')
    : '';

  const iconEl    = document.getElementById('mobDetailIcon');
  const tipoEl    = document.getElementById('mobDetailTipo');
  const obsEl     = document.getElementById('mobDetailObs');
  const bodyEl    = document.getElementById('mobDetailBody');
  const actionsEl = document.getElementById('mobDetailActions');
  const delayMeta = getTaskDelayMeta(task);

  if (iconEl) { iconEl.innerHTML = tp.i; iconEl.style.background = `${tp.c}22`; iconEl.style.color = tp.c; }
  if (tipoEl) { tipoEl.textContent = tp.nm; tipoEl.style.color = tp.c; }
  if (obsEl)  obsEl.textContent = task.obs || '—';

  const rows = [
    { l: 'Estado',     v: `<span style="font-weight:700;color:${st.tc}">${st.nm}</span>` },
    task.estado === 'en_proceso' && {
      l: 'Orden',
      cls: 'mob-detail-row-order',
      v: `<select class="mob-detail-order-select" aria-label="Orden de la tarea" onchange="mob_setTaskOrder('${id}', this.value)">${orderOptions}</select>`
    },
    task.fecha && { l: 'Fecha',      v: formatDate(task.fecha) },
    task.hi    && { l: 'Horario',    v: task.hi + (task.hf ? ' – ' + task.hf : '') },
    u          && { l: 'Asignado',   v: esc(u.nm) },
    task.fIni  && { l: 'Inicio real', v: fmtTS(task.fIni) },
    task.fFin  && { l: 'Fin real',   v: fmtTS(task.fFin) },
    (task.fIni && task.hf) && { l: 'Duraci\u00f3n', v: (calcDuration(actualStart(task), task.hf) || {txt:'—'}).txt },
    task.prio    && { l: 'Prioridad',  v: '<span style="color:#dc2626;font-weight:700">● Alta</span>' },
    delayMeta.active && delayMeta.currentReason && { l: 'Demora activa',   v: `<span style="color:#92400E;font-weight:600">${esc(delayMeta.currentReason)}</span>` }
  ].filter(Boolean);

  if (bodyEl) bodyEl.innerHTML = rows.map(r =>
    `<div class="mob-detail-row${r.cls ? ' ' + r.cls : ''}">
      <span class="mob-detail-row-label">${r.l}</span>
      <span class="mob-detail-row-val">${r.v}</span>
    </div>`).join('');

  if (bodyEl && delayMeta.count) {
    bodyEl.innerHTML += `
      <div class="mob-detail-row">
        <span class="mob-detail-row-label">Demoras</span>
        <span class="mob-detail-row-val">${delayMeta.count}</span>
      </div>
      <div class="mob-detail-row">
        <span class="mob-detail-row-label">Tiempo demorado</span>
        <span class="mob-detail-row-val">${formatMinutesCompact(delayMeta.totalWithActive)}</span>
      </div>`;
  }

  if (bodyEl && delayMeta.active && delayMeta.currentStartLabel) {
    bodyEl.innerHTML += `
      <div class="mob-detail-row">
        <span class="mob-detail-row-label">Desde</span>
        <span class="mob-detail-row-val">${delayMeta.currentStartLabel}</span>
      </div>`;
  }

  let actHtml = '';
  if (task.estado === 'pendiente') {
    actHtml += `<button class="mob-detail-action-btn" style="background:#0066CC;color:#fff;" onclick="mob_closeTaskDetail();mob_changeStatus('${id}','en_proceso')">Iniciar tarea</button>`;
  } else if (task.estado === 'en_proceso') {
    if (!delayMeta.active) {
      actHtml += `<button class="mob-detail-action-btn" style="background:#10B981;color:#fff;" onclick="mob_closeTaskDetail();mob_changeStatus('${id}','terminado')">Finalizar tarea</button>`;
    }
  }
  if (task.estado === 'en_proceso') {
    actHtml += `<button class="mob-detail-action-btn" style="background:rgba(217,119,6,.1);color:#D97706;border:1px solid #FCD34D;" onclick="mob_closeTaskDetail();mob_openDelay('${id}')">${delayMeta.active ? 'Cerrar demora' : 'Iniciar demora'}</button>`;
  }
  if (delayMeta.count || delayMeta.active) {
    actHtml += `<button class="mob-detail-action-btn" style="background:var(--bg-app);color:var(--text-muted);border:1px solid var(--border-color);" onclick="mob_closeTaskDetail();openDelayHistory('${id}', true)">Historial</button>`;
  }
  if (isAdmin) {
    actHtml += `<button class="mob-detail-action-btn" style="background:var(--bg-app);color:var(--text-muted);border:1px solid var(--border-color);" onclick="mob_closeTaskDetail();mob_editTask('${id}')">Editar</button>`;
    actHtml += `<button class="mob-detail-action-btn" style="background:rgba(239,68,68,.1);color:#ef4444;" onclick="mob_closeTaskDetail();deleteTask('${id}')">Eliminar</button>`;
  }
  if (actionsEl) actionsEl.innerHTML = actHtml;

  document.getElementById('mobTaskDetail')?.classList.add('open');
}

function mob_closeTaskDetail() {
  document.getElementById('mobTaskDetail')?.classList.remove('open');
}

function mob_setDept(dept) {
  App.department = dept;
  mob_render();
}

function mob_setStat(filter) {
  mob.filter = filter;
  mob_renderStats();
  mob_renderTaskList();
}

function mob_setStatus(filter) {
  mob.filter = filter;
  mob_renderStats();
  mob_renderTaskList();
}

function mob_prevMonth() {
  if (App.month === 0) { App.year--; App.month = 11; } else App.month--;
  App.selectedDay = (App.year === new Date().getFullYear() && App.month === new Date().getMonth()) ? todayKey() : (App.year + '-' + pad2(App.month + 1) + '-01');
  mob_renderDayStrip();
  mob_renderTaskList();
}

function mob_nextMonth() {
  if (App.month === 11) { App.year++; App.month = 0; } else App.month++;
  App.selectedDay = (App.year === new Date().getFullYear() && App.month === new Date().getMonth()) ? todayKey() : (App.year + '-' + pad2(App.month + 1) + '-01');
  mob_renderDayStrip();
  mob_renderTaskList();
}

function mob_switchTab(tab) {
  mob.tab = tab;
  ['cal','res','usr','search'].forEach(t => {
    const key = t.charAt(0).toUpperCase() + t.slice(1);
    document.getElementById(`mobNav${key}`)?.classList.toggle('on', t === tab);
  });
  const calEl = document.getElementById('mobTabCal');
  const resEl = document.getElementById('mobTabRes');
  const usrEl = document.getElementById('mobTabUsr');
  const fabEl = document.getElementById('mobFab');

  if (calEl) calEl.style.display = tab === 'cal' ? 'contents' : 'none';
  if (resEl) resEl.style.display = tab === 'res' ? 'block'    : 'none';
  if (usrEl) usrEl.style.display = tab === 'usr' ? 'block'    : 'none';
  if (fabEl) fabEl.style.display = tab === 'cal' ? 'flex'     : 'none';

  if (tab === 'res') mob_renderResumen();
  if (tab === 'usr') mob_renderUsers();
}

function mob_renderResumen() {
  const el = document.getElementById('mobTabRes');
  if (!el) return;
  const dept      = App.department;
  const allTasks  = App.tasks.filter(t => mob_deptMatch(t));
  const today     = todayKey();
  const currentMonthPrefix = today.substring(0, 7); // gets YYYY-MM

  const monthTasks = allTasks.filter(t => {
    return t.fecha && t.fecha.startsWith(currentMonthPrefix);
  });

  const total = monthTasks.length;
  const pend  = monthTasks.filter(t => t.estado === 'pendiente').length;
  const prog  = monthTasks.filter(t => t.estado === 'en_proceso').length;
  const done  = monthTasks.filter(t => t.estado === 'terminado').length;
  const eff   = total ? Math.round(done / total * 100) : 0;

  const byCnt = {};
  monthTasks.forEach(t => { byCnt[t.tipo] = (byCnt[t.tipo] || 0) + 1; });
  const topTypes = Object.entries(byCnt).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const deptLabel = dept === 'deposito' ? 'deposito' : 'fabrica';
  el.innerHTML = `
    <div style="padding:12px 14px 0;font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;">${MONTHS[App.month]} ${App.year} · ${deptLabel}</div>
    <div class="mob-res-section">
      <div class="mob-res-title">Resumen del mes</div>
      <div class="mob-res-row"><span class="mob-res-label">Total tareas</span><span class="mob-res-val">${total}</span></div>
      <div class="mob-res-row"><span class="mob-res-label">⏳ Pendiente</span><span class="mob-res-val" style="color:#D97706">${pend}</span></div>
      <div class="mob-res-row"><span class="mob-res-label">▶ En proceso</span><span class="mob-res-val" style="color:#0066CC">${prog}</span></div>
      <div class="mob-res-row"><span class="mob-res-label">✓ Completadas</span><span class="mob-res-val" style="color:#059669">${done}</span></div>
      <div class="mob-res-row">
        <span class="mob-res-label">Avance</span>
        <span class="mob-res-val" style="color:${eff >= 70 ? '#059669' : eff >= 40 ? '#D97706' : '#dc2626'}">${eff}%</span>
      </div>
      <div class="mob-res-bar" style="margin-top:8px;"><div class="mob-res-bar-fill" style="width:${eff}%;background:${eff >= 70 ? '#10B981' : eff >= 40 ? '#F59E0B' : '#ef4444'}"></div></div>
    </div>
    ${topTypes.length ? `<div class="mob-res-section">
      <div class="mob-res-title">Por tipo de actividad</div>
      ${topTypes.map(([tipo, cnt]) => {
        const tp  = findActivityType(tipo);
        const pct = total ? Math.round(cnt / total * 100) : 0;
        return `<div class="mob-res-row">
          <span class="mob-res-label" style="display:flex;align-items:center;gap:6px;"><span style="color:${tp.c}">${tp.i}</span>${tp.nm}</span>
          <span class="mob-res-val">${cnt} <span style="color:var(--text-muted);font-weight:500;font-size:11px;">(${pct}%)</span></span>
        </div>`;
      }).join('')}
    </div>` : ''}
  `;
}

function mob_renderUsers() {
  const el = document.getElementById('mobTabUsr');
  if (!el) return;
  const isAdmin = App.currentUser?.rol === 'admin';

  const dept    = App.department;
  const visible = activeUsers().filter(u => u.dep === dept || u.dep === 'admin');

  el.innerHTML = `
    <div style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:16px;font-weight:800;color:var(--text-main);">Usuarios</span>
      ${isAdmin ? `<button onclick="openUsrModal()" style="background:#3b82f6;color:#fff;border:none;padding:8px 14px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;">+ Nuevo</button>` : ''}
    </div>
    ${visible.map(u => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--border-light);background:var(--bg-surface);">
        <div style="width:36px;height:36px;border-radius:10px;background:${u.clr};color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${u.ini}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(u.nm)}</div>
          <div style="font-size:11px;color:var(--text-muted);font-weight:600;">${u.rl} · ${u.dep === 'admin' ? 'Todos' : u.dep === 'deposito' ? 'deposito' : 'fabrica'}</div>
        </div>
        ${isAdmin ? `<button onclick="openUsrModal('${u.id}')" style="padding:6px 10px;border-radius:7px;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);font-size:11px;font-weight:700;cursor:pointer;">Editar</button>` : ''}
      </div>`).join('')}
  `;
}

function mob_syncNotifDot() {
  const dot     = document.getElementById('mobNotifDot');
  const deskBdg = document.getElementById('notifBadge');
  if (dot && deskBdg) {
    const cnt = parseInt(deskBdg.textContent || '0');
    dot.style.display = (deskBdg.style.display !== 'none' && cnt > 0) ? 'block' : 'none';
  }
}

function mob_openNewTask() {
  const nowDefaults = currentTaskDateTime();
  mob._editId  = null;
  mob.ntkData  = { tipo:'', prio:false, fecha: nowDefaults.date, hi: nowDefaults.time, asig:'', obs:'' };
  mob._ntkStep = 1;

  const titleEl = document.getElementById('mobNtkFormTitle');
  if (titleEl) titleEl.textContent = 'Nueva Tarea';

  mob_ntkBuildTypeGrid();
  mob_ntkBuildUserList();
  const fe = document.getElementById('mobNtkFecha');
  if (fe) fe.value = mob.ntkData.fecha;
  const hi = document.getElementById('mobNtkHi');
  if (hi) hi.value = mob.ntkData.hi;
  const obs = document.getElementById('mobNtkObs');
  if (obs) obs.value = '';
  document.getElementById('mobNtkPrioToggle')?.classList.remove('on');
  document.getElementById('mobNtkPrioSwitch')?.classList.remove('on');
  mob_ntkRenderStep();
  document.getElementById('mobNewTask')?.classList.add('open');
}

function mob_closeNewTask() {
  document.getElementById('mobNewTask')?.classList.remove('open');
}

function mob_ntkBuildTypeGrid() {
  const grid = document.getElementById('mobNtkTypeGrid');
  if (!grid) return;
  const types = ACTIVITY_TYPES.filter(t => t.dep.includes(App.department));
  grid.innerHTML = types.map(t => {
    const hexR = parseInt(t.c.slice(1,3),16);
    const hexG = parseInt(t.c.slice(3,5),16);
    const hexB = parseInt(t.c.slice(5,7),16);
    return `<button class="mob-ntk-type-btn" data-tipo="${t.id}" onclick="mob_selectType('${t.id}')"
        style="--sel-color:${t.c};--sel-bg:rgba(${hexR},${hexG},${hexB},.08)">
      <span class="mob-ntk-type-icon" style="color:${t.c}">${t.i}</span>
      <span class="mob-ntk-type-name" style="color:${t.c}">${t.nm}</span>
    </button>`;
  }).join('');
}

function mob_selectType(id) {
  mob.ntkData.tipo = id;
  document.querySelectorAll('#mobNtkTypeGrid .mob-ntk-type-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.tipo === id);
  });
}

function mob_togglePrio() {
  mob.ntkData.prio = !mob.ntkData.prio;
  document.getElementById('mobNtkPrioToggle')?.classList.toggle('on', mob.ntkData.prio);
  document.getElementById('mobNtkPrioSwitch')?.classList.toggle('on', mob.ntkData.prio);
}

function mob_ntkBuildUserList() {
  const list = document.getElementById('mobNtkUserList');
  if (!list) return;
  const opts = users.filter(u => u.activo && (u.dep === App.department || u.dep === 'admin'));
  const row = (id, ini, nm, clr) => {
    const sel = mob.ntkData.asig === id;
    return `<div class="mob-ntk-user-opt${sel ? ' selected' : ''}" onclick="mob_selectUser('${id}')">
      <div class="mob-ntk-user-av" style="background:${clr};color:#fff">${ini}</div>
      <span class="mob-ntk-user-name">${nm}</span>
      <div class="mob-ntk-check">${sel ? '✓' : ''}</div>
    </div>`;
  };
  list.innerHTML = row('','—','Sin asignar','var(--bg-hover)') +
    opts.map(u => row(u.id, u.ini, esc(u.nm), u.clr)).join('');
}

function mob_selectUser(id) {
  mob.ntkData.asig = id;
  document.querySelectorAll('#mobNtkUserList .mob-ntk-user-opt').forEach(el => {
    const onclick = el.getAttribute('onclick') || '';
    const uid = (onclick.match(/'([^']*)'/) || [])[1] ?? '';
    const sel = uid === id;
    el.classList.toggle('selected', sel);
    const chk = el.querySelector('.mob-ntk-check');
    if (chk) chk.textContent = sel ? '✓' : '';
  });
}

function mob_ntkRenderStep() {
  const s = mob._ntkStep;
  document.querySelectorAll('.mob-ntk-step').forEach((el, i) => el.classList.toggle('active', i + 1 === s));
  const bar = document.getElementById('mobNtkProgress');
  if (bar) bar.style.width = `${Math.round(s / 3 * 100)}%`;
  const lbl = document.getElementById('mobNtkStepLbl');
  if (lbl) lbl.textContent = `Paso ${s}/3`;
  const back = document.getElementById('mobNtkBackBtn');
  if (back) back.style.display = s > 1 ? 'block' : 'none';
  const next = document.getElementById('mobNtkNextBtn');
  if (next) next.textContent = s === 3 ? 'Guardar tarea' : 'Siguiente →';
  if (s === 3) mob_ntkRenderSummary();
}

function mob_ntkRenderSummary() {
  const d   = mob.ntkData;
  const tp  = findActivityType(d.tipo);
  const u   = findUser(d.asig);
  const sum = document.getElementById('mobNtkSummary');
  if (!sum) return;
  sum.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:22px;color:${tp.c}">${tp.i}</span>
      <span style="font-weight:700;font-size:15px;color:${tp.c}">${tp.nm}</span>
      ${d.prio ? '<span style="font-size:9px;background:rgba(220,38,38,.1);color:#dc2626;padding:2px 7px;border-radius:4px;font-weight:700;">PRIORITARIA</span>' : ''}
    </div>
    ${d.fecha ? `<div style="font-size:13px;color:var(--text-muted);">\u23f0 ${formatDate(d.fecha)}</div>` : ''}
    ${d.hi    ? `<div style="font-size:13px;color:var(--text-muted);">\u23f0 ${d.hi}${d.hf ? ' – ' + d.hf : ''}</div>` : ''}
    ${u       ? `<div style="font-size:13px;color:var(--text-muted);">\ud83d\udc64 ${esc(u.nm)}</div>` : ''}
  `;
}

function mob_ntkNext() {
  const s = mob._ntkStep;
  if (s === 1) {
    if (!mob.ntkData.tipo) { toast('Seleccion\u00f3 un tipo de actividad'); return; }
    mob._ntkStep = 2; mob_ntkRenderStep();
  } else if (s === 2) {
    const nowDefaults = currentTaskDateTime();
    mob.ntkData.fecha = document.getElementById('mobNtkFecha')?.value || nowDefaults.date;
    mob.ntkData.hi    = document.getElementById('mobNtkHi')?.value   || nowDefaults.time;
    mob.ntkData.hf    = '';
    mob._ntkStep = 3; mob_ntkRenderStep();
  } else {
    mob_ntkSave();
  }
}

function mob_ntkBack() {
  if (mob._ntkStep > 1) { mob._ntkStep--; mob_ntkRenderStep(); }
}

async function mob_ntkSave() {
  mob.ntkData.obs = (document.getElementById('mobNtkObs')?.value || '').trim();
  const d = mob.ntkData;
  const prevView = mob_captureViewState();
  const nowDefaults = currentTaskDateTime();

  if (mob._editId) {
    const task = App.tasks.find(t => t.id === mob._editId);
    if (!task) { mob_closeNewTask(); return; }
    const prev = { ...task };
    Object.assign(task, {
      tipo:  d.tipo,
      obs:   d.obs,
      hi:    d.hi,
      hf:    task.hf,
      fecha: d.fecha || task.fecha,
      asig:  d.asig,
      prio:  d.prio
    });
    mob_revealTask(task, true);
    mob_closeNewTask();
    mob_render();
    saveTasksToCache();
    toast('Tarea actualizada');
    try {
      await syncTask(task, 'save_task');
    } catch (e) {
      Object.assign(task, prev);
      mob_restoreViewState(prevView);
      mob_render();
      saveTasksToCache();
      toast(formatActionError(e, 'No se pudo guardar la tarea'));
    }
  } else {
    const _isAtCli = d.tipo === 'atencion_cliente';
    const _atNow   = _isAtCli ? new Date() : null;
    const newTask = {
      id:        generateId(),
      fecha:     _isAtCli ? todayKey() : (d.fecha || nowDefaults.date),
      tipo:      d.tipo,
      obs:       d.obs,
      hi:        _isAtCli ? timeStr(_atNow.getHours(), _atNow.getMinutes()) : (d.hi || nowDefaults.time),
      hf:        '',
      estado:    _isAtCli ? 'en_proceso' : 'pendiente',
      asig:      d.asig,
      dep:       App.department,
      prio:      d.prio,
      fCrea:     new Date().toISOString(),
      fIni:      _isAtCli ? _atNow.toISOString() : '',
      fFin:      '',
      pOrder:    _isAtCli ? -1 : undefined,
      creadoPor: App.currentUser?.nm || ''
    };
    App.tasks.unshift(newTask);
    App.lastSaved = newTask.id;
    mob_revealTask(newTask, true);
    mob_closeNewTask();
    mob_render();
    saveTasksToCache();
    toast('Tarea creada');
    try {
      await syncTask(newTask, 'save_task');
    } catch (e) {
      App.tasks = App.tasks.filter(t => t.id !== newTask.id);
      App.lastSaved = null;
      mob_restoreViewState(prevView);
      mob_render();
      saveTasksToCache();
      toast(formatActionError(e, 'No se pudo crear la tarea'));
    }
  }
}

function mob_openDelay(id) {
  mob._delayTaskId = id;
  const task = App.tasks.find(t => t.id === id);
  if (!task) return;
  const ta = document.getElementById('mobDelayText');
  const titleEl = document.getElementById('mobDelayTitle');
  const hintEl = document.getElementById('mobDelayHint') || document.querySelector('.mob-delay-hint');
  const statusEl = document.getElementById('mobDelayStatus');
  const clearBtn = document.getElementById('mobDelayClear') || document.querySelector('.mob-delay-clear');
  const saveBtn = document.getElementById('mobDelaySave') || document.querySelector('.mob-delay-save');
  const delayMeta = getTaskDelayMeta(task);

  mob._delayMode = delayMeta.active ? 'finish' : 'start';

  if (titleEl) titleEl.textContent = delayMeta.active ? 'Cerrar demora' : 'Registrar demora';
  if (hintEl) {
    hintEl.textContent = delayMeta.active
      ? 'Al cerrar la demora se sumara el tiempo acumulado a la tarea.'
      : 'Describe el motivo para iniciar la demora.';
  }
  if (statusEl) {
    const lines = [];
    if (delayMeta.count) lines.push(`${delayMeta.count} ${delayMeta.count === 1 ? 'demora registrada' : 'demoras registradas'}`);
    if (delayMeta.count) lines.push(`Tiempo acumulado: ${formatMinutesCompact(delayMeta.totalWithActive)}`);
    if (delayMeta.active && delayMeta.currentStartLabel) lines.push(`Activa desde ${delayMeta.currentStartLabel}`);
    statusEl.textContent = lines.join(' - ');
    statusEl.style.display = lines.length ? 'block' : 'none';
  }
  if (clearBtn) clearBtn.style.display = delayMeta.active ? 'none' : '';
  if (saveBtn) saveBtn.textContent = delayMeta.active ? 'Cerrar demora' : 'Iniciar demora';
  if (ta) {
    ta.value = delayMeta.active ? (task?.retraso || '') : '';
    ta.disabled = !!delayMeta.active;
  }
  document.getElementById('mobDelayOverlay')?.classList.add('open');
  document.getElementById('mobDelaySheet')?.classList.add('open');
  if (!delayMeta.active) requestAnimationFrame(() => ta?.focus());
}

function mob_closeDelay() {
  document.getElementById('mobDelayOverlay')?.classList.remove('open');
  document.getElementById('mobDelaySheet')?.classList.remove('open');
  mob._delayTaskId = null;
  mob._delayMode = null;
}

async function mob_saveDelay() {
  const id = mob._delayTaskId;
  const mode = mob._delayMode || 'start';
  const text = (document.getElementById('mobDelayText')?.value || '').trim();
  mob_closeDelay();
  const task = App.tasks.find(t => t.id === id);
  if (!task) return;

  const prev = { ...task };
  if (mode === 'start') {
    if (!text) {
      toast('Escribe el motivo de la demora');
      return;
    }

    const delayId = `dly_${generateId().slice(0, 10)}`;
    const startedAt = new Date().toISOString();
    task.delayCount = toInt(task.delayCount, 0) + 1;
    task.delayActive = true;
    task.delayCurrentId = delayId;
    task.delayCurrentStart = startedAt;
    task.retraso = text;
    delete App.delayHistoryByTask[id];

    mob_render();
    renderDrawer();
    saveTasksToCache();
    toast('Demora iniciada');

    try {
      const result = await syncDelayAction('start_delay', {
        id: delayId,
        delayId,
        taskId: id,
        motivo: text,
        startedAt
      });
      if (result?.task) replaceTaskFromServer(result.task);
      mob_render();
      renderDrawer();
      saveTasksToCache();
    } catch (e) {
      Object.assign(task, prev);
      mob_render();
      renderDrawer();
      saveTasksToCache();
      toast(formatActionError(e, 'No se pudo iniciar la demora'));
    }
    return;
  }

  const endedAt = new Date().toISOString();
  const extraMinutes = elapsedMinutesSince(task.delayCurrentStart);
  task.delayActive = false;
  task.delayTotalMinutes = toInt(task.delayTotalMinutes, 0) + extraMinutes;
  task.delayCurrentId = '';
  task.delayCurrentStart = '';
  task.retraso = '';
  delete App.delayHistoryByTask[id];
  mob_render();
  renderDrawer();
  saveTasksToCache();
  toast('Demora cerrada');
  try {
    const result = await syncDelayAction('finish_delay', {
      id: prev.delayCurrentId || '',
      delayId: prev.delayCurrentId || '',
      taskId: id,
      endedAt
    });
    if (result?.task) replaceTaskFromServer(result.task);
    mob_render();
    renderDrawer();
    saveTasksToCache();
  } catch (e) {
    Object.assign(task, prev);
    mob_render();
    renderDrawer();
    saveTasksToCache();
    toast(formatActionError(e, 'No se pudo cerrar la demora'));
  }
}

async function mob_changeStatus(id, newStatus) {
  const task = App.tasks.find(t => t.id === id);
  if (!task) return;

  if (newStatus === 'en_proceso' && !task.fIni) {
    if (isScheduledForFuture(task.fecha)) {
      const ok = confirm(`Esta tarea es del ${formatDate(task.fecha)}.\n\u00bfAdelantar al día de hoy?`);
      if (!ok) return;
      task.fecha = todayKey();
    } else if (task.hi && isBeforeScheduled(task.hi)) {
      const ok = confirm(`La hora prevista es ${task.hi}.\n\u00bfIniciar ahora de todas formas?`);
      if (!ok) return;
      const now = new Date();
      task.hi = timeStr(now.getHours(), now.getMinutes());
    }
  }

  await changeTaskStatus(id, newStatus);
  mob_revealTask(task, false);
  render();
}

function mob_editTask(id) {
  if (App.currentUser?.rol !== 'admin') { toast('Solo los administradores pueden editar tareas'); return; }
  const task = App.tasks.find(t => t.id === id);
  if (!task) return;

  mob._editId  = id;
  mob.ntkData  = { tipo: task.tipo, prio: !!task.prio, fecha: task.fecha || todayKey(), hi: task.hi || '', asig: task.asig || '', obs: task.obs || '' };
  mob._ntkStep = 1;

  const titleEl = document.getElementById('mobNtkFormTitle');
  if (titleEl) titleEl.textContent = 'Editar Tarea';

  mob_ntkBuildTypeGrid();
  mob_ntkBuildUserList();

  const fe = document.getElementById('mobNtkFecha');
  if (fe) fe.value = mob.ntkData.fecha;
  const hi = document.getElementById('mobNtkHi');
  if (hi) hi.value = mob.ntkData.hi;
  const obs = document.getElementById('mobNtkObs');
  if (obs) obs.value = mob.ntkData.obs;

  document.getElementById('mobNtkPrioToggle')?.classList.toggle('on', mob.ntkData.prio);
  document.getElementById('mobNtkPrioSwitch')?.classList.toggle('on', mob.ntkData.prio);

  requestAnimationFrame(() => {
    document.querySelectorAll('#mobNtkTypeGrid .mob-ntk-type-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.tipo === mob.ntkData.tipo);
    });
  });

  mob_ntkRenderStep();
  document.getElementById('mobNewTask')?.classList.add('open');
}

function mob_toggleNotif() {
  const sheet = document.getElementById('mobNotifSheet');
  if (!sheet) return;
  if (sheet.classList.contains('open')) {
    mob_closeNotif();
  } else {
    mob_renderNotifSheet();
    document.getElementById('mobNotifOverlay')?.classList.add('open');
    sheet.classList.add('open');
    markAllRead();
    mob_syncNotifDot();
  }
}

function mob_closeNotif() {
  document.getElementById('mobNotifOverlay')?.classList.remove('open');
  document.getElementById('mobNotifSheet')?.classList.remove('open');
}

function mob_renderNotifSheet() {
  const listEl  = document.getElementById('mobNotifList');
  const markBtn = document.getElementById('mobNotifMarkAll');
  if (!listEl) return;

  const notifs = getStoredNotifs();
  const unread = notifs.filter(n => !n.read).length;
  if (markBtn) markBtn.style.visibility = unread > 0 ? 'visible' : 'hidden';

  if (!notifs.length) {
    const bellSVG = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
    listEl.innerHTML = `<div class="mob-notif-empty">${bellSVG}<span>Sin notificaciones</span></div>`;
    return;
  }

  listEl.innerHTML = notifs.map(n => {
    const ico  = notifIconCfg(n.type);
    const tp   = findActivityType(n.taskTipo);
    const dep  = n.taskDep === 'deposito' ? 'deposito' : 'fabrica';
    const time = notifTimeAgo(n.ts);
    const obs  = n.taskObs ? `<div class="mob-notif-obs">${esc(n.taskObs)}</div>` : '';
    return `<div class="mob-notif-item${n.read ? '' : ' unread'}"
         onclick="mob_notifGoTo('${n.id}','${n.taskFecha}','${n.taskDep}')">
      <div class="mob-notif-ico" style="background:${ico.bg};color:${ico.color}">${ico.svg}</div>
      <div class="mob-notif-body">
        <div class="mob-notif-msg">${esc(n.message)}</div>
        <div class="mob-notif-meta">
          <span style="color:${tp.c};font-weight:600">${tp.nm}</span>
          - ${dep} - ${time}
        </div>
        ${obs}
      </div>
      ${!n.read ? '<span class="mob-notif-unread-dot"></span>' : ''}
    </div>`;
  }).join('');
}

function mob_markAllRead() {
  markAllRead();
  mob_renderNotifSheet();
  mob_syncNotifDot();
}

function mob_notifGoTo(id, fecha, dep) {
  markNotifRead(id);
  mob_closeNotif();
  if (fecha) {
    if (dep && dep !== 'undefined') App.department = dep;
    mob_resetViewFilters();
    focusCalendarDate(fecha);
    render();
  }
}

const _mobOrigRender = render;
render = function() {
  _mobOrigRender();
  if (IS_MOBILE) mob_render();
};

const _mobOrigSidebar = updateSidebarUser;
updateSidebarUser = function() {
  _mobOrigSidebar();
  if (IS_MOBILE) mob_renderHeader();
};

const _mobOrigBellBadge = updateBellBadge;
updateBellBadge = function() {
  _mobOrigBellBadge();
  if (IS_MOBILE) mob_syncNotifDot();
};

mob_init();
