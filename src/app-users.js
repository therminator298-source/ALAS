// ============================================================
//  ALAS F\u00e1brica — app-users.js
//  Secci\u00f3n extra\u00edda de gestión de usuarios
// ============================================================

function userDepartmentLabel(dep) {
  if (dep === 'admin') return 'Todos';
  if (dep === 'deposito') return 'Dep\u00f3sito';
  return 'F\u00e1brica';
}

function userFilterOptions() {
  return [
    { id: 'todos',    label: 'Todos',    match: () => true },
    { id: 'admin',    label: 'Admin',    match: u => u.dep === 'admin' || u.rol === 'admin' },
    { id: 'fabrica',  label: 'F\u00e1brica',  match: u => u.dep === 'fabrica' },
    { id: 'deposito', label: 'Dep\u00f3sito', match: u => u.dep === 'deposito' }
  ];
}

function filteredUsersByDept(rows) {
  const opts = userFilterOptions();
  const active = opts.find(o => o.id === App.userFilter) || opts[0];
  return rows.filter(active.match);
}

function setUserDeptFilter(filterId) { App.userFilter = filterId; renderUsers(); }

function renderUserFilters(rows) {
  const wrap = document.getElementById('usrDeptFilters');
  const meta = document.getElementById('usrDeptMeta');
  if (!wrap || !meta) return;

  const opts     = userFilterOptions();
  const filtered = filteredUsersByDept(rows);

  wrap.innerHTML = opts.map(opt => {
    const count  = rows.filter(opt.match).length;
    const active = App.userFilter === opt.id ? ' is-active' : '';
    return `<button type="button" class="usr-filter-btn${active}" onclick="setUserDeptFilter('${opt.id}')">
      <span>${opt.label}</span>
      <span class="usr-filter-count">${count}</span>
    </button>`;
  }).join('');

  if (App.usersLoading && !rows.length) { meta.textContent = 'Cargando usuarios…'; return; }
  const currentLabel = (opts.find(o => o.id === App.userFilter) || opts[0]).label;
  meta.textContent = `${filtered.length} usuario${filtered.length === 1 ? '' : 's'} en ${currentLabel.toLowerCase()}`;
}

function renderUsers() {
  const tb = document.getElementById('usrTableBody');
  if (!tb) return;
  syncTopbarKpis();

  const rows = [...users].sort((a, b) => {
    if (a.activo !== b.activo) return a.activo ? -1 : 1;
    if (a.rol !== b.rol)       return a.rol === 'admin' ? -1 : 1;
    return a.nm.localeCompare(b.nm, 'es', { sensitivity: 'base' });
  });

  const filtered = filteredUsersByDept(rows);
  renderUserFilters(rows);

  if (App.usersLoading && !rows.length) {
    tb.innerHTML = Array.from({ length: 4 }, () => `<tr class="usr-skeleton-row">
      <td style="padding:16px;"><div class="usr-skeleton usr-skeleton-user"></div></td>
      <td style="padding:16px;"><div class="usr-skeleton usr-skeleton-chip"></div></td>
      <td style="padding:16px;"><div class="usr-skeleton usr-skeleton-line"></div></td>
      <td style="padding:16px;"><div class="usr-skeleton usr-skeleton-chip"></div></td>
      <td style="padding:16px;"><div class="usr-skeleton usr-skeleton-chip"></div></td>
    </tr>`).join('');
    return;
  }

  let h = '';
  filtered.forEach(u => {
    h += `<tr class="usr-row">
      <td class="usr-cell usr-cell-name">
        <div class="usr-person">
          <div class="usr-avatar" style="background:${u.clr};">${u.ini}</div>
          <span class="usr-name">${esc(u.nm)}</span>
        </div>
      </td>
      <td class="usr-cell"><span class="usr-role-chip${u.rol === 'admin' ? ' is-admin' : ''}">${u.rl}</span></td>
      <td class="usr-cell usr-cell-dept">${userDepartmentLabel(u.dep)}</td>
      <td class="usr-cell"><span class="usr-status-chip${u.activo ? ' is-active' : ''}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td class="usr-cell usr-cell-action">
        <button onclick="openUsrModal('${u.id}')" style="background:transparent;border:1px solid var(--border-color);color:var(--text-muted);padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:.15s;" onmouseover="this.style.background='var(--bg-hover)'" \u270f\ufe0f Editar</button>
      </td>
    </tr>`;
  });

  const emptyMsg = rows.length ? 'No hay usuarios en este departamento.' : 'No hay usuarios cargados.';
  tb.innerHTML = h || `<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--text-muted);">${emptyMsg}</td></tr>`;
  tb.querySelectorAll('button[onclick^="openUsrModal"]').forEach(btn => {
    btn.className = 'usr-edit-btn';
    btn.textContent = '\u270f\ufe0f Editar';
    btn.removeAttribute('style');
    btn.removeAttribute('onmouseover');
    btn.removeAttribute('onmouseout');
  });
}

function openUsrModal(userId) {
  App.editingUserId = userId || null;
  const existingUser = userId ? users.find(u => u.id === userId) : null;

  document.getElementById('uModTitle').textContent = existingUser ? 'Editar Usuario' : 'Nuevo Usuario';
  document.getElementById('uNm').value    = existingUser ? existingUser.nm  : '';
  document.getElementById('uRol').value   = existingUser ? existingUser.rol : 'operativo';
  document.getElementById('uDep').value   = existingUser ? (existingUser.dep === 'admin' ? 'admin' : existingUser.dep) : 'fabrica';
  document.getElementById('uActivo').checked = existingUser ? existingUser.activo : true;
  document.getElementById('uPin').value   = '';

  const isAdmin = (existingUser ? existingUser.rol : 'operativo') === 'admin';
  document.getElementById('uPinContainer').style.display = isAdmin ? 'block' : 'none';
  document.getElementById('usrModal').style.display = 'flex';
}

async function saveUsr() {
  const nm     = document.getElementById('uNm').value.trim();
  const rol    = document.getElementById('uRol').value;
  const dep    = rol === 'admin' ? 'admin' : document.getElementById('uDep').value;
  const pin    = document.getElementById('uPin').value.trim();
  const activo = document.getElementById('uActivo').checked;

  if (!nm) { toast('Ingresa un nombre', false); return; }
  if (rol === 'admin' && !pin && !App.editingUserId) { toast('Ingresa un PIN para el administrador', false); return; }

  const btn = document.getElementById('uSaveBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn-spinner"></span> Guardando…'; }

  try {
    const payload = { action: 'save_user', user: { nombre: nm, rol, dep, activo, pin } };
    if (App.editingUserId) payload.user.id = App.editingUserId;

    await postAction(payload);
    invalidateCache(CACHE_KEYS.users);
    document.getElementById('usrModal').style.display = 'none';
    App.editingUserId = null;
    await loadUsers(true);
    renderUsers();
    toast('Usuario guardado');
  } catch (e) {
    console.error('Error guardando usuario', e);
    toast(e.message || 'No se pudo guardar el usuario');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Guardar Usuario'; }
  }
}
