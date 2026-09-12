import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_PACKAGE
  ? pathToFileURL(process.env.PLAYWRIGHT_PACKAGE).href : 'playwright');
const baseURL = process.env.ACUSES_TEST_URL || 'http://127.0.0.1:5179';
const output = 'node_modules/.cache/acuses-startup';
await mkdir(output, { recursive: true });
const sdk = await readFile('node_modules/@supabase/supabase-js/dist/umd/supabase.js', 'utf8');
const baseline = process.argv.includes('--baseline');
const today = new Date().toISOString().slice(0, 10);

async function openFixture(browser, viewport, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch: viewport.width < 768 });
  const state = { requests: [], fail: options.failAPI || false, failSdk: options.failSdk || false, failChart: options.failChart || false, sdkLoads: 0, chartDelay: options.chartDelay ?? 1200 };
  await context.addInitScript(role => {
    localStorage.setItem('alas.sso.session', JSON.stringify({
      userId: '29157828-c678-4181-b254-8fefe550190b', name: 'Prueba de rendimiento',
      role, permissions: ['calendario'], exp: Date.now() + 3600000,
    }));
  }, options.role || 'admin');
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.includes('chart.umd')) {
      state.requests.push({ kind: 'chart', at: Date.now() });
      await new Promise(resolve => setTimeout(resolve, state.chartDelay));
      if (state.failChart) return route.abort();
      if (url.origin === new URL(baseURL).origin) return route.continue();
      return route.fulfill({ contentType: 'application/javascript', body: 'window.Chart = class { static register() {} constructor() {} destroy() {} };' });
    }
    if (url.origin === new URL(baseURL).origin) {
      if (url.pathname === '/acuse/vendor/supabase.js') {
        state.sdkLoads++;
        if (state.failSdk) return route.abort();
      }
      return route.continue();
    }
    if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('supabase')) {
      state.requests.push({ kind: 'sdk-cdn', at: Date.now() });
      await new Promise(resolve => setTimeout(resolve, 700));
      return route.fulfill({ contentType: 'application/javascript', body: sdk });
    }
    if (url.pathname.startsWith('/rest/v1/')) {
      if (url.pathname === '/rest/v1/rpc/ensure_user') return route.fulfill({ json: null });
      assert.equal(request.method(), 'GET', 'Performance tests must not write to the database');
      const table = url.pathname.split('/').at(-1);
      const select = url.searchParams.get('select') || '';
      state.requests.push({ kind: table, select, at: Date.now() });
      await new Promise(resolve => setTimeout(resolve, options.apiDelay ?? 400));
      if (state.fail || (options.failKpis && select === 'estado,activo')) return route.fulfill({ status: 503, json: { message: 'Conexion de prueba interrumpida' } });
      if (table === 'repartidores') return route.fulfill({ json: [{ id: 1, codigo: 'R01', nombre: 'Repartidor de prueba', activo: true }] });
      if (table !== 'acuses') return route.fulfill({ json: [] });
      if (select === 'estado,activo' && options.kpiRows) {
        const offset = Number(url.searchParams.get('offset') || 0);
        const limit = Number(url.searchParams.get('limit') || 1000);
        const rows = Array.from({ length: options.kpiRows }, (_, i) => ({
          estado: ['Pendiente', 'En Reparto', 'Entregado', 'Anulado', 'en_transito'][i % 5], activo: i % 7 !== 0,
        }));
        return route.fulfill({ json: rows.slice(offset, offset + limit) });
      }
      const rows = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1, nro_acuse: `AC-${String(i + 1).padStart(4, '0')}`, cod_cliente: 'C01',
        estado: ['Pendiente', 'En Reparto', 'Entregado'][i % 3], activo: true,
        cliente_nombre: 'Cliente de prueba', cliente_ciudad: 'Asuncion', zona: 'Central',
        fecha_emision: today, fecha_entrega: null, created_at: `${today}T12:00:00Z`,
        repartidor_id: 1, repartidor_nombre: 'Repartidor de prueba', observacion: '',
        acuse_detalle: [{ cantidad: 3 }],
      }));
      return route.fulfill({ json: rows, headers: { 'content-range': '0-11/12' } });
    }
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, state, errors };
}

async function measure(browser, width, height) {
  const { context, page, state, errors } = await openFixture(browser, { width, height });
  try {
    const start = Date.now();
    await page.goto(`${baseURL}/acuses`, { waitUntil: 'commit' });
    const frame = page.frameLocator('iframe[title="Acuses"]');
    await frame.locator('#viewDashboard').waitFor({ state: 'visible' });
    const shellMs = Date.now() - start;
    await frame.locator('#contentPanel tbody tr[data-acuse-id]').first().waitFor({ state: 'visible', timeout: 20000 });
    const rowsMs = Date.now() - start;
    await page.screenshot({ path: `${output}/${baseline ? 'before' : 'after'}-${width}.png` });
    const result = { width, shellMs, rowsMs, requests: state.requests.map(({ at, ...rest }) => ({ ...rest, ms: at - start })), errors };
    console.log(JSON.stringify(result));
    await writeFile(`${output}/${baseline ? 'before' : 'after'}-${width}.json`, JSON.stringify(result, null, 2));
    if (!baseline) {
      assert.deepEqual(errors, []);
      assert.equal(state.requests.filter(request => request.kind === 'sdk-cdn').length, 0);
      assert.equal(state.requests.filter(request => request.kind === 'chart').length, 0);
      assert.equal(state.requests.filter(request => request.kind === 'repartidores').length, 1);
      assert.equal(state.requests.filter(request => request.kind === 'acuses').length, 2);
      const clipping = await frame.locator('.table-wrapper').evaluate(node => ({ height: node.clientHeight, width: node.clientWidth }));
      assert.ok(clipping.height >= 150, 'The table must have usable visible height');
    }
  } finally { await context.close(); }
}

async function navigate(page, view) {
  if (page.viewportSize().width < 768) await page.getByLabel('Vista de Acuses').selectOption(view);
  else await page.getByRole('tab', { name: { resumen: 'Dashboard Resumen', acuses: 'Acuses', calendario: 'Calendario', repartidores: 'Repartidores', historial: 'Historial' }[view], exact: true }).click();
}

async function verifyNavigation(browser, width) {
  const { context, page, state, errors } = await openFixture(browser, { width, height: 900 }, { apiDelay: 700, chartDelay: 1800 });
  try {
    await page.goto(`${baseURL}/acuses`, { waitUntil: 'domcontentloaded' });
    const frame = page.frameLocator('iframe[title="Acuses"]');
    await navigate(page, 'historial');
    await frame.locator('#viewHistorial').waitFor({ state: 'visible' });
    await page.waitForTimeout(1600);
    assert.ok(await frame.locator('#viewHistorial').isVisible(), 'Initial data must not reset the selected view');
    assert.equal(state.requests.filter(request => request.kind === 'chart').length, 0);
    await navigate(page, 'resumen');
    await frame.locator('#viewResumen').waitFor({ state: 'visible' });
    const embedded = await (await page.locator('iframe[title="Acuses"]').elementHandle()).contentFrame();
    await embedded.waitForFunction(() => document.querySelector('#viewResumen')?.getAttribute('aria-busy') !== 'true');
    await embedded.waitForFunction(() => window.Chart?.getChart('chartDona'));
    const pixels = await embedded.evaluate(() => Array.from(document.querySelectorAll('#viewResumen canvas')).map(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return { width: canvas.width, height: canvas.height, painted: data.some((value, index) => index % 4 === 3 && value > 0) };
    }));
    assert.ok(pixels.length > 0 && pixels.every(canvas => canvas.width > 0 && canvas.height > 0 && canvas.painted), 'Summary charts must render actual pixels');
    await page.screenshot({ path: `${output}/summary-${width}.png` });
    await navigate(page, 'calendario');
    await frame.locator('#calendarGrid .cal-day').first().waitFor();
    await navigate(page, 'repartidores');
    await frame.locator('#contentPanel tbody tr').first().waitFor();
    await navigate(page, 'acuses');
    await frame.locator('#contentPanel tbody tr[data-acuse-id]').first().waitFor();
    assert.equal(state.requests.filter(request => request.kind === 'chart').length, 1);
    assert.deepEqual(errors, []);
    console.log(`PASS navigation during loading, all views, charts: ${width}px`);
  } finally { await context.close(); }
}

async function verifyRecovery(browser, kind) {
  const { context, page, state, errors } = await openFixture(browser, { width: 390, height: 844 }, {
    apiDelay: 150, failAPI: kind === 'api', failSdk: kind === 'sdk', failKpis: kind === 'kpis', failChart: kind === 'chart', chartDelay: 50,
  });
  try {
    await page.goto(`${baseURL}/acuses`);
    const frame = page.frameLocator('iframe[title="Acuses"]');
    if (kind === 'api' || kind === 'sdk') {
      await frame.locator('#contentPanel').getByRole('button', { name: 'Reintentar' }).waitFor();
      state.fail = false; state.failSdk = false;
      await frame.locator('#contentPanel').getByRole('button', { name: 'Reintentar' }).click();
    }
    await frame.locator('#contentPanel tbody tr[data-acuse-id]').first().waitFor();
    if (kind === 'chart') {
      await navigate(page, 'resumen');
      await frame.locator('.chart-unavailable').first().waitFor();
      state.failChart = false;
      await frame.locator('.chart-unavailable').first().getByRole('button', { name: 'Reintentar' }).click();
      const embedded = await (await page.locator('iframe[title="Acuses"]').elementHandle()).contentFrame();
      await embedded.waitForFunction(() => window.Chart?.getChart('chartDona'));
    }
    assert.deepEqual(errors, []);
    console.log(`PASS recovery and independent loading: ${kind}`);
  } finally { await context.close(); }
}

async function verifyRole(browser) {
  const { context, page } = await openFixture(browser, { width: 390, height: 844 }, { role: 'calendario' });
  try {
    await page.goto(`${baseURL}/acuses`);
    await page.waitForURL('**/calendario');
    assert.equal(await page.locator('iframe[title="Acuses"]').count(), 0);
    console.log('PASS calendar-only role remains restricted');
  } finally { await context.close(); }
}

async function verifyKpisPagination(browser) {
  const { context, page, state, errors } = await openFixture(browser, { width: 1440, height: 900 }, { apiDelay: 20, kpiRows: 1005 });
  try {
    await page.goto(`${baseURL}/acuses`);
    const frame = page.frameLocator('iframe[title="Acuses"]');
    await frame.locator('#val-acuses').filter({ hasText: '1.005' }).waitFor();
    const expected = { pendientes: 0, en_transito: 0, entregados: 0, anulados: 0 };
    for (let i = 0; i < 1005; i++) expected[i % 7 === 0 ? 'anulados' : ['pendientes', 'en_transito', 'entregados', 'anulados', 'en_transito'][i % 5]]++;
    for (const [key, count] of Object.entries(expected)) assert.equal(await frame.locator(`#val-${key}`).innerText(), String(count));
    assert.equal(state.requests.filter(request => request.select === 'estado,activo').length, 2);
    assert.deepEqual(errors, []);
    console.log('PASS paginated counters: 1005 records, inactive and legacy statuses');
  } finally { await context.close(); }
}

const browser = await chromium.launch();
try {
  await measure(browser, 1440, 900);
  await measure(browser, 390, 844);
  if (process.argv.includes('--smoke')) process.exitCode = 0;
  if (!baseline && !process.argv.includes('--smoke')) {
    await verifyNavigation(browser, 1440);
    await verifyNavigation(browser, 390);
    for (const kind of ['api', 'sdk', 'kpis', 'chart']) await verifyRecovery(browser, kind);
    await verifyRole(browser);
    await verifyKpisPagination(browser);
  }
} finally { await browser.close(); }
