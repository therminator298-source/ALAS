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
const _ssoCfg      = (typeof ALAS_SSO_CONFIG !== 'undefined' && ALAS_SSO_CONFIG) || {};
const SSO_SESSION_KEY = 'alas.sso.session';
const LAUNCHER_URL    = _ssoCfg.launcherUrl || 'http://localhost:5173';

// Verificación server-side: el secreto vive solo en Supabase, nunca en el cliente.
const VERIFY_URL    = 'https://xkgumqztscqcwamtimuh.supabase.co/functions/v1/verify-sso-token';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZ3VtcXp0c2NxY3dhbXRpbXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDc0MjEsImV4cCI6MjA5NTg4MzQyMX0.ncD9XUgR6VDhKiShPAwdNgp3tRoKWIlt4JFEq8audX8';

/* ── Verificación remota via Edge Function ──────────────────────────────── */
async function sso_verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const res  = await fetch(VERIFY_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!data.valid) {
      console.warn('[ALAS SSO] Token rechazado por el servidor.');
      return null;
    }
    return data.payload;
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
