/**
 * sso-config.example.js — Plantilla de configuración SSO para Calendario
 *
 * INSTRUCCIONES:
 * 1. Copiar este archivo como: sso-config.js (en la raíz del proyecto)
 * 2. Reemplazar los valores con los reales de producción.
 * 3. NUNCA commitear sso-config.js (está en .gitignore).
 *
 * El secreto debe ser IDÉNTICO al VITE_SSO_SECRET del Launcher
 * y al secret en js/alas-sso-config.js de CajaVenta.
 *
 * Generar un secreto nuevo:
 *   node -e "require('crypto').randomBytes(32).toString('hex')"
 */
var ALAS_SSO_CONFIG = {
  // Secreto HMAC-SHA-256 — mismo en todos los sistemas
  secret: 'REEMPLAZAR-CON-EL-SECRETO-REAL',

  // URL del Launcher — a dónde redirigir si no hay sesión
  // Desarrollo: 'http://localhost:5173'
  // Producción: 'https://tu-launcher.vercel.app'
  launcherUrl: 'http://localhost:5173',
};
