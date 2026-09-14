/**
 * Verificación de la vista móvil del Calendario.
 *
 * Comprueba, en un viewport de teléfono real (390x844, táctil), las cosas que
 * la auditoría encontró rotas:
 *   1. Ningún campo con fuente < 16px  → iOS deja de hacer zoom al enfocar.
 *   2. Ningún control interactivo < 44px → objetivo táctil mínimo.
 *   3. Sin scroll horizontal en la página.
 *   4. El título largo se lee entero (antes quedaban ~70px y se cortaba).
 *   5. El popover del tipo de tarea entra completo en pantalla.
 *   6. Deslizar una tarjeta cambia el estado y lo persiste.
 *   7. El asa (⠿) reordena con el dedo y guarda en UNA sola llamada.
 *   8. El menú «···» ofrece por botón todo lo que hacen los gestos.
 *
 * Uso:  node scripts/verify-calendar-mobile.mjs
 *       CALENDAR_TEST_URL=http://127.0.0.1:5179 node scripts/verify-calendar-mobile.mjs
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.CALENDAR_TEST_URL || 'http://127.0.0.1:5179';
const outputDir = 'node_modules/.cache/calendar-mobile';
await mkdir(outputDir, { recursive: true });

const now = new Date();
const iso = (off = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const today = iso();
const deposits = ['Depósito Central', 'Fábrica', 'Depósito Luque Sanber'];
const LARGO = 'REPOSICIÓN Y CONTROL DE MERCADERÍAS DEL SECTOR DE HERRAMIENTAS';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  OK  ' : ' FALLA'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

async function fixture(context) {
  const state = {
    writes: [],
    rows: Array.from({ length: 14 }, (_, i) => ({
      id: i + 1,
      titulo: i === 0 ? LARGO : `Tarea de prueba ${i + 1}`,
      descripcion: 'Control de existencias y verificación de ubicaciones.',
      fecha: i < 8 ? today : iso(2),
      hora: '09:00',
      responsable: i === 0 ? 'Responsable con nombre y apellido muy extensos' : `Responsable ${(i % 3) + 1}`,
      deposito: deposits[Math.floor(i / 6)] ?? deposits[0],
      estado: ['Pendiente', 'En curso', 'Hecho'][i % 3],
      usuario: 'Prueba móvil',
      orden: i % 6,
      created_at: new Date().toISOString(),
    })),
  };

  await context.addInitScript(() => {
    localStorage.setItem('alas.sso.session', JSON.stringify({
      userId: '29157828-c678-4181-b254-8fefe550190b',
      name: 'Prueba Móvil',
      role: 'calendario',
      permissions: ['calendario'],
      exp: Date.now() + 3600000,
    }));
  });

  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === new URL(baseURL).origin) return route.continue();

    if (url.pathname === '/rest/v1/tareas') {
      const method = request.method();
      if (method === 'GET') {
        const [from, to] = url.searchParams.getAll('fecha').map((v) => v.slice(4));
        return route.fulfill({ json: state.rows.filter((t) => t.fecha >= from && t.fecha <= to) });
      }
      state.writes.push({ method, payload: request.postDataJSON() });
      const id = Number((url.searchParams.get('id') || '').replace('eq.', ''));
      if (method === 'POST') {
        const task = { ...request.postDataJSON(), id: 1000 + state.writes.length, orden: null, created_at: new Date().toISOString() };
        state.rows.push(task);
        return route.fulfill({ status: 201, json: task });
      }
      if (method === 'PATCH') state.rows = state.rows.map((t) => (t.id === id ? { ...t, ...request.postDataJSON() } : t));
      if (method === 'DELETE') state.rows = state.rows.filter((t) => t.id !== id);
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      state.writes.push({ method: 'RPC', name: url.pathname.split('/').pop(), payload: request.postDataJSON() });
      return route.fulfill({ status: 204, body: '' });
    }
    if (url.pathname.startsWith('/rest/v1/')) return route.fulfill({ json: [] });
    return route.abort();
  });

  return state;
}

/** Dispara un swipe táctil real sobre un elemento. */
async function swipe(page, selector, deltaX) {
  await page.evaluate(({ selector, deltaX }) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`no existe ${selector}`);
    const r = el.getBoundingClientRect();
    const y = r.top + r.height / 2;
    const x0 = r.left + r.width / 2;
    const touch = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    const fire = (type, x) => el.dispatchEvent(new TouchEvent(type, {
      bubbles: true, cancelable: true,
      touches: type === 'touchend' ? [] : [touch(x)],
      changedTouches: [touch(x)],
    }));
    fire('touchstart', x0);
    for (let i = 1; i <= 8; i++) fire('touchmove', x0 + (deltaX * i) / 8);
    fire('touchend', x0 + deltaX);
  }, { selector, deltaX });
  await page.waitForTimeout(400);
}

/** Arrastra con el dedo desde el asa de una tarjeta hasta otra posición. */
async function dragHandle(page, context, fromIndex, toIndex) {
  const cdp = await context.newCDPSession(page);
  const box = await page.evaluate(({ fromIndex, toIndex }) => {
    const ls = document.querySelectorAll('li');
    const grip = ls[fromIndex].querySelector('button[aria-label^="Reordenar"]').getBoundingClientRect();
    const from = ls[fromIndex].getBoundingClientRect();
    const to = ls[toIndex].getBoundingClientRect();
    return { x: grip.left + grip.width / 2, y: grip.top + grip.height / 2, ty: to.top + (grip.top - from.top) + grip.height / 2 };
  }, { fromIndex, toIndex });

  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 12, radiusY: 12, force: 1, id: 1 }],
  });

  await touch('touchStart', box.x, box.y);
  await page.waitForTimeout(300);            // dnd-kit activa el arrastre a los 150ms
  const steps = 14, dy = (box.ty - box.y) / steps;
  for (let i = 1; i <= steps; i++) { await touch('touchMove', box.x, box.y + dy * i); await page.waitForTimeout(45); }
  await page.waitForTimeout(150);
  await touch('touchEnd', box.x, box.ty);
  await page.waitForTimeout(700);
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const state = await fixture(context);
  const page = await context.newPage();
  page.on('pageerror', (e) => check('sin errores de JS', false, e.message));

  await page.goto(`${baseURL}/calendario`, { waitUntil: 'domcontentloaded' });
  await page.locator('li').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outputDir}/mobile-lista.png`, fullPage: false });

  /* 1 ─ Fuente de los campos ≥ 16px (zoom de iOS) */
  const smallFonts = await page.$$eval('input, textarea, select', (els) =>
    els.filter((el) => el.offsetParent !== null)
      .map((el) => ({ tag: el.tagName, type: el.type, size: parseFloat(getComputedStyle(el).fontSize) }))
      .filter((x) => x.size < 16));
  check('campos con fuente ≥ 16px (sin zoom en iOS)', smallFonts.length === 0, JSON.stringify(smallFonts));

  /* 2 ─ Objetivos táctiles ≥ 44px */
  const smallTargets = await page.$$eval('button, a, [role="button"], input, select', (els) =>
    els.filter((el) => el.offsetParent !== null && el.getBoundingClientRect().width > 0)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 34), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((x) => x.h < 44 || x.w < 44));
  check('todos los controles ≥ 44px', smallTargets.length === 0, smallTargets.length ? JSON.stringify(smallTargets) : '');

  /* 3 ─ Sin scroll horizontal */
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
  }));
  check('sin scroll horizontal en la página', overflow.doc <= overflow.win + 1, `scrollWidth ${overflow.doc} vs ${overflow.win}`);

  /* 4 ─ El título largo se lee entero */
  const titulo = await page.evaluate((LARGO) => {
    const h = [...document.querySelectorAll('h3')].find((n) => n.textContent.includes('REPOSICIÓN'));
    if (!h) return null;
    const r = h.getBoundingClientRect();
    return { ancho: Math.round(r.width), alto: Math.round(r.height), completo: h.scrollHeight <= h.clientHeight + 1, texto: h.textContent === LARGO };
  }, LARGO);
  check('título largo visible completo', !!titulo && titulo.completo && titulo.texto,
    titulo ? `ancho ${titulo.ancho}px, alto ${titulo.alto}px (antes ~70px de ancho, 1 línea)` : 'no se encontró el título');

  /* 5 ─ Swipe cambia el estado */
  const antes = await page.locator('li').first().locator('button').first().textContent();
  await swipe(page, 'li:first-of-type > div:last-child', -110);
  const despues = await page.locator('li').first().locator('button').first().textContent();
  const patched = state.writes.some((w) => w.method === 'PATCH' && w.payload?.estado);
  check('deslizar cambia el estado y lo guarda', antes !== despues && patched, `${antes?.trim()} → ${despues?.trim()}`);

  /* 7 ─ Reordenar con el dedo desde el asa */
  const ordenAntes = await page.$$eval('li h3', (ns) => ns.map((n) => n.textContent));
  const escriturasAntes = state.writes.length;
  await dragHandle(page, context, 0, 2);
  const ordenDespues = await page.$$eval('li h3', (ns) => ns.map((n) => n.textContent));
  const reorderWrites = state.writes.slice(escriturasAntes);
  const unaSolaLlamada = reorderWrites.filter((w) => w.method === 'RPC' || w.method === 'PATCH').length === 1;
  check('el asa reordena con el dedo', ordenAntes.join() !== ordenDespues.join(), `${ordenAntes[0]} pasó a la posición ${ordenDespues.indexOf(ordenAntes[0]) + 1}`);
  check('el reorden se guarda en una sola llamada', unaSolaLlamada, JSON.stringify(reorderWrites.map((w) => w.name || w.method)));

  /* 8 ─ El menú «···» cubre lo mismo que los gestos */
  await page.locator('li').first().getByRole('button', { name: /Más acciones/ }).click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${outputDir}/mobile-menu.png` });
  const sheet = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return d ? [...d.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean) : [];
  });
  const cubre = ['Pendiente', 'En curso', 'Hecho', 'Mover', 'Editar tarea completa', 'Eliminar tarea']
    .every((t) => sheet.some((b) => b.includes(t)));
  check('el menú ofrece por botón lo que hacen los gestos', cubre, sheet.join(' · '));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  /* 6 ─ Formulario: el popover de tipo entra en pantalla */
  await page.getByRole('button', { name: 'Nueva tarea', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDir}/mobile-form.png` });

  await page.getByRole('button', { name: /Elegí el tipo de tarea/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outputDir}/mobile-form-tipo.png` });

  const pop = await page.evaluate(() => {
    const panel = document.querySelector('[role="listbox"]');
    if (!panel) return null;
    const r = panel.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), vh: window.innerHeight, dentro: r.top >= 0 && r.bottom <= window.innerHeight + 1 };
  });
  check('popover de tipo de tarea entero en pantalla', !!pop && pop.dentro,
    pop ? `top ${pop.top}, bottom ${pop.bottom}, viewport ${pop.vh}` : 'no se encontró el popover');

  /* 7 ─ Se puede elegir un tipo y guardar */
  await page.getByRole('button', { name: /^DESCARGA$/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Guardar/ }).click();
  await page.waitForTimeout(700);
  const created = state.writes.some((w) => w.method === 'POST' && w.payload?.titulo === 'DESCARGA');
  check('se puede crear una tarea desde el teléfono', created, created ? '' : JSON.stringify(state.writes.slice(-3)));

  await page.screenshot({ path: `${outputDir}/mobile-final.png` });

  /* ─ Resumen ─ */
  const fails = results.filter((r) => !r.ok);
  console.log(`\n${results.length - fails.length}/${results.length} verificaciones OK`);
  console.log(`Capturas en ${outputDir}/`);
  if (fails.length) process.exitCode = 1;
} finally {
  await browser.close();
}
