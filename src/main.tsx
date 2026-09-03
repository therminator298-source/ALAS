import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('No se encontró el elemento #root');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA: registrar service worker (solo en producción, tras la carga)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* PWA opcional; si falla, la app sigue funcionando */
    });
  });
}
