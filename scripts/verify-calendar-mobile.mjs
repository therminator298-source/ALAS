import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_PACKAGE
  ? pathToFileURL(process.env.PLAYWRIGHT_PACKAGE).href : 'playwright');
const baseURL = process.env.CALENDAR_TEST_URL || 'http://127.0.0.1:5179';
const outputDir = 'node_modules/.cache/calendar-mobile';
await mkdir(outputDir, { recursive: true });
const date = new Date();
const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const deposits = ['Depósito Central', 'Fábrica', 'Depósito Luque Sanber'];

async function fixture(context) {
  const state = { reads: 0, writes: [], failRead: false, failWrite: false, delay: 0, rows: Array.from({ length: 18 }, (_, i) => ({
    id: i + 1, titulo: i === 0 ? 'REPOSICIÓN Y CONTROL DE MERCADERÍAS DEL SECTOR DE HERRAMIENTAS' : `Tarea de prueba ${i + 1}`,
    descripcion: 'Control de existencias y verificación de ubicaciones.', fecha: today, hora: '09:00',
    responsable: i === 0 ? 'Responsable con nombre y apellido muy extensos' : `Responsable ${i % 3 + 1}`,
    deposito: deposits[Math.floor(i / 6)], prioridad: i === 0 ? 'ALTA' : 'NORMAL',
    estado: ['Pendiente', 'En curso', 'Hecho'][i % 3], usuario: 'Prueba móvil', orden: i, created_at: new Date().toISOString(),
  })) };
  await context.addInitScript(() => {
    localStorage.setItem('alas.sso.session', JSON.stringify({
      userId: '29157828-c678-4181-b254-8fefe550190b', name: 'Prueba móvil',
      role: 'calendario', permissions: ['calendario'], exp: Date.now() + 3600000,
    }));
  });
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === new URL(baseURL).origin) return route.continue();
    if (url.pathname === '/rest/v1/tareas') {
      const method = request.method();
      if (state.delay) await new Promise(resolve => setTimeout(resolve, state.delay));
      if (method === 'GET') {
        state.reads++;
        if (state.failRead) return route.fulfill({ status: 503, json: { message: 'Error de prueba' } });
        const [from, to] = url.searchParams.getAll('fecha').map(value => value.slice(4));
        return route.fulfill({ json: state.rows.filter(task => task.fecha >= from && task.fecha <= to) });
      }
      state.writes.push({ method, payload: request.postDataJSON() });
      if (state.failWrite) return route.fulfill({ status: 503, json: { message: 'Error de prueba' } });
      const id = Number((url.searchParams.get('id') || '').replace('eq.', ''));
      if (method === 'POST') {
        const task = { ...request.postDataJSON(), id: 1000 + state.writes.length, orden: null, created_at: new Date().toISOString() };
        state.rows.push(task);
        return route.fulfill({ status: 201, json: task });
      }
      if (method === 'PATCH') state.rows = state.rows.map(task => task.id === id ? { ...task, ...request.postDataJSON() } : task);
      if (method === 'DELETE') state.rows = state.rows.filter(task => task.id !== id);
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.startsWith('/rest/v1/')) return route.fulfill({ json: [] });
    return route.abort();
  });
  return state;
}

async function baseline() {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const state = await fixture(context);
    const page = await context.newPage();
    await page.goto(`${baseURL}/calendario`);
    await page.locator('.cal-row').first().waitFor();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outputDir}/before-mobile.png` });
    console.log(JSON.stringify({ title: await page.title(), reads: state.reads, text: await page.locator('body').innerText() }));
    await page.getByRole('button', { name: 'Nueva tarea', exact: true }).last().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outputDir}/before-form.png` });
  } finally { await browser.close(); }
}

if (process.argv.includes('--baseline')) await baseline();
