// ============================================================
//  alas-auth-client.js — SSO client para Calendario Tareas
//
//  Verifica el alas_token firmado emitido por el Launcher ALAS.
//  Si el token es válido, construye App.currentUser y salta el
//  login PIN. Si no hay token ni sesión SSO, deja que el login
//  PIN normal continúe.
//
//  SSO_SECRET debe ser idéntico al VITE_SSO_SECRET del Launcher.
//  Se incluye en el bundle junto con el resto de src/ (ver build.js).
// ============================================================

/* ── Configuración ──────────────────────────────────────────────────────── */
// Lee desde sso-config.js (cargado en index.html antes del bundle, no commiteado).
// ALAS_SSO_CONFIG es una var global definida en ese archivo.
const _ssoCfg      = (typeof ALAS_SSO_CONFIG !== 'undefined' && ALAS_SSO_CONFIG) || {};
const SSO_SECRET      = _ssoCfg.secret      || 'REEMPLAZAR-EN-PRODUCCION';
const SSO_SESSION_KEY = 'alas.sso.session';
const LAUNCHER_URL    = _ssoCfg.launcherUrl || 'http://localhost:5173';

/* ── Utilidades base64url ───────────────────────────────────────────────── */
function sso_fromBase64url(str) {
  let padded = str.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) padded += '=';
  return atob(padded);
}

/* ── HMAC-SHA-256 ───────────────────────────────────────────────────────── */
async function sso_importKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

async function sso_verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;

  const payloadB64 = token.slice(0, dot);
  const sigB64     = token.slice(dot + 1);

  try {
    const key      = await sso_importKey(SSO_SECRET);
    const sigBytes = Uint8Array.from(sso_fromBase64url(sigB64), c => c.charCodeAt(0));
    const valid    = await crypto.subtle.verify(
      'HMAC', key, sigBytes,
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) {
      console.warn('[ALAS SSO] Firma inválida — token rechazado.');
      return null;
    }
    const payload = JSON.parse(decodeURIComponent(escape(sso_fromBase64url(payloadB64))));
    if (Date.now() > payload.exp) {
      console.warn('[ALAS SSO] Token expirado.');
      return null;
    }
    return payload;
  } catch (e) {
    console.warn('[ALAS SSO] Error al verificar token:', e.message);
    return null;
  }
}

/* ── Persistencia ───────────────────────────────────────────────────────── */
function sso_save(payload) {
  try { localStorage.setItem(SSO_SESSION_KEY, JSON.stringify(payload)); } catch(e) {}
}

function sso_load() {
  try {
    const raw = localStorage.getItem(SSO_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || Date.now() > s.exp) { localStorage.removeItem(SSO_SESSION_KEY); return null; }
    return s;
  } catch(e) { return null; }
}

function sso_clear() {
  try { localStorage.removeItem(SSO_SESSION_KEY); } catch(e) {}
}

/* ── Construir y aplicar usuario ────────────────────────────────────────── */
// Construye el objeto user compatible con normalizeUserRecord (definido en app.js)
// usando las funciones que ya existen en el bundle: normalizeRole, roleLabel,
// normalizeDepartment, initials, colorFromId.
function sso_buildUser(payload) {
  const rol  = normalizeRole(payload.role);
  const dep  = normalizeDepartment('', rol);
  const nm   = String(payload.name || payload.email || 'Usuario Launcher').trim();
  return {
    id:     String(payload.userId || '').trim() || 'sso-user',
    nm,
    rl:     roleLabel(rol),
    dep,
    ini:    initials(nm),
    clr:    colorFromId(payload.userId || 'sso-user'),
    rol,
    activo: true,
  };
}

function sso_apply(payload) {
  const user = sso_buildUser(payload);
  // Marcar como SSO para que loadUsers() no lo expulse
  App.ssoAuthenticated = true;
  setLoggedInUser(user, 'sso-launcher');
  console.info('[ALAS SSO] Sesión aplicada. Usuario:', user.nm, '| Rol:', user.rol);
}

/* ── initSSO ────────────────────────────────────────────────────────────── */
// Llamada desde bootstrap() en app-boot.js, DESPUÉS de loadUsers().
// Retorna true si se autenticó vía SSO, false si debe continuar con PIN.
async function initSSO() {
  // Si ya hay sesión (restaurada por restoreSession()), no interferir
  if (App.currentUser) return false;

  // ── 1. Token en URL ──
  const params   = new URLSearchParams(window.location.search);
  const rawToken = params.get('alas_token');

  if (rawToken) {
    // Limpiar del URL ANTES de validar
    params.delete('alas_token');
    const cleanSearch = params.toString() ? '?' + params.toString() : '';
    window.history.replaceState({}, '', window.location.pathname + cleanSearch);

    const payload = await sso_verifyToken(decodeURIComponent(rawToken));
    if (payload) {
      sso_save(payload);
      sso_apply(payload);
      return true;
    }
    console.warn('[ALAS SSO] Token del URL inválido. Verificando sesión guardada...');
  }

  // ── 2. Sesión guardada ──
  const stored = sso_load();
  if (stored) {
    sso_apply(stored);
    return true;
  }

  // ── 3. Sin SSO — continúa con login PIN normal ──
  console.info('[ALAS SSO] Sin sesión SSO. Login PIN habilitado.');
  return false;
}

/* ── API pública ────────────────────────────────────────────────────────── */
// Usable desde la consola o desde otros módulos para auditoría o logout SSO.
window.AlasSSO = {
  getSession:  sso_load,
  clearSession: sso_clear,
  logoutSSO: function() {
    sso_clear();
    App.ssoAuthenticated = false;
    window.location.replace(LAUNCHER_URL);
  }
};
