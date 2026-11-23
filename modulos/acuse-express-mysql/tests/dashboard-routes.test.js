const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { badRequest, errorHandler } = require('../server/errors');
const createDashboardInteractiveRouter = require('../server/routes/dashboardInteractiveRoutes');

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function requestJson(server, pathname, options = {}) {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${pathname}`, options);
  const json = await response.json();
  return { status: response.status, json };
}

test('GET /summary devuelve el payload del servicio y conserva query params', async () => {
  const calls = [];
  const app = express();
  app.use('/api/dashboard/interactivo', createDashboardInteractiveRouter({
    summary: async (query) => {
      calls.push(query);
      return { ok: true, periodo: { scope: 'month' } };
    },
    listAcusesByKpi: async () => ({ items: [] }),
    calendarMonth: async () => ({ days: [] }),
    listRepartidores: async () => ({ items: [] }),
    logPrintAction: async () => ({ ok: true })
  }));
  app.use(errorHandler);

  const server = await listen(app);
  try {
    const result = await requestJson(server, '/api/dashboard/interactivo/summary?year=2026&month=4');
    assert.equal(result.status, 200);
    assert.deepEqual(result.json, { ok: true, periodo: { scope: 'month' } });
    assert.deepEqual(calls, [{ year: '2026', month: '4' }]);
  } finally {
    server.close();
  }
});

test('GET /panel/:kpi propaga errores HttpError como respuesta JSON', async () => {
  const app = express();
  app.use('/api/dashboard/interactivo', createDashboardInteractiveRouter({
    summary: async () => ({ ok: true }),
    listAcusesByKpi: async () => {
      throw badRequest('KPI invalido');
    },
    calendarMonth: async () => ({ days: [] }),
    listRepartidores: async () => ({ items: [] }),
    logPrintAction: async () => ({ ok: true })
  }));
  app.use(errorHandler);

  const server = await listen(app);
  try {
    const result = await requestJson(server, '/api/dashboard/interactivo/panel/invalido');
    assert.equal(result.status, 400);
    assert.deepEqual(result.json, { error: 'KPI invalido' });
  } finally {
    server.close();
  }
});

test('POST /acuses/:id/print responde 201 cuando el servicio registra la impresion', async () => {
  const calls = [];
  const app = express();
  app.use(express.json());
  app.use('/api/dashboard/interactivo', createDashboardInteractiveRouter({
    summary: async () => ({ ok: true }),
    listAcusesByKpi: async () => ({ items: [] }),
    calendarMonth: async () => ({ days: [] }),
    listRepartidores: async () => ({ items: [] }),
    logPrintAction: async (id, body) => {
      calls.push({ id, body });
      return { ok: true, estado: 'En Reparto' };
    }
  }));
  app.use(errorHandler);

  const server = await listen(app);
  try {
    const result = await requestJson(server, '/api/dashboard/interactivo/acuses/42/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Usuario: 'Tester' })
    });
    assert.equal(result.status, 201);
    assert.deepEqual(result.json, { ok: true, estado: 'En Reparto' });
    assert.deepEqual(calls, [{ id: '42', body: { Usuario: 'Tester' } }]);
  } finally {
    server.close();
  }
});
