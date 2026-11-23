const test = require('node:test');
const assert = require('node:assert/strict');

const { badRequest, notFound } = require('../server/errors');
const { createApp, __test__: serverIndexTest } = require('../server/index');

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

async function requestText(server, pathname, options = {}) {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${pathname}`, options);
  const text = await response.text();
  return { status: response.status, text };
}

function buildServices(overrides = {}) {
  const calls = [];
  const services = {
    calls,
    pool: {
      async execute() {
        return [[{ ok: 1 }]];
      }
    },
    config: {
      acuseDb: 'BD_ALAS_ACUSE',
      sapDb: 'BD_ALAS_SAP'
    },
    schema: {
      async healthCheck() {
        return {
          acuse: { ok: true },
          detalle: { ok: true },
          historial: { ok: true },
          log: { ok: true },
          repartidor: { ok: true },
          clientes: { ok: true },
          articulos: { ok: true }
        };
      }
    },
    catalogos: {
      async listRepartidores() { return []; },
      async createRepartidor() { return { ok: true }; },
      async searchClientes() { return []; },
      async searchArticulos() { return []; },
      async stockArticulo() { return []; },
      async preciosArticulo() { return []; }
    },
    acuses: {
      async listAcuses(query) {
        calls.push({ op: 'listAcuses', query });
        return { items: [] };
      },
      async createAcuse(body) {
        calls.push({ op: 'createAcuse', body });
        return { ID_Acuse: 1, ...body };
      },
      async getAcuse(id) {
        calls.push({ op: 'getAcuse', id });
        return { ID_Acuse: Number(id), Nro_Acuse: 'AC-0001' };
      },
      async updateAcuse(id, body) {
        calls.push({ op: 'updateAcuse', id, body });
        return { ID_Acuse: Number(id), ...body };
      },
      async changeEstado(id, body) {
        calls.push({ op: 'changeEstado', id, body });
        return { ID_Acuse: Number(id), Estado: body.Estado };
      },
      async deactivateAcuse(id, body) {
        calls.push({ op: 'deactivateAcuse', id, body });
        return { ok: true, ID_Acuse: Number(id) };
      },
      async dashboardResumen() { return {}; },
      async historialAcciones() { return { items: [] }; },
      async resumenRepartidores() { return []; }
    },
    dashboardInteractive: {
      async summary() { return {}; },
      async listAcusesByKpi() { return { items: [] }; },
      async calendarMonth() { return { days: [] }; },
      async listRepartidores() { return { items: [] }; },
      async logPrintAction() { return { ok: true }; }
    }
  };

  return Object.assign(services, overrides, {
    acuses: { ...services.acuses, ...(overrides.acuses || {}) },
    catalogos: { ...services.catalogos, ...(overrides.catalogos || {}) },
    schema: { ...services.schema, ...(overrides.schema || {}) },
    dashboardInteractive: { ...services.dashboardInteractive, ...(overrides.dashboardInteractive || {}) }
  });
}

test('POST /api/acuses crea un acuse y devuelve 201', async () => {
  const services = buildServices();
  const app = createApp(services);
  const server = await listen(app);

  try {
    const payload = {
      Cod_Cliente: 'CLI-001',
      Estado: 'Pendiente',
      Fecha_Emision: '2026-04-24',
      ID_Repartidor: 5
    };
    const result = await requestJson(server, '/api/acuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(result.status, 201);
    assert.equal(result.json.Cod_Cliente, 'CLI-001');
    assert.deepEqual(services.calls[0], { op: 'createAcuse', body: payload });
  } finally {
    server.close();
  }
});

test('PUT /api/acuses/:id actualiza un acuse existente', async () => {
  const services = buildServices();
  const app = createApp(services);
  const server = await listen(app);

  try {
    const payload = {
      Estado: 'Entregado',
      Observacion: 'Actualizado por API'
    };
    const result = await requestJson(server, '/api/acuses/18', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(result.status, 200);
    assert.equal(result.json.ID_Acuse, 18);
    assert.deepEqual(services.calls[0], { op: 'updateAcuse', id: '18', body: payload });
  } finally {
    server.close();
  }
});

test('PATCH /api/acuses/:id/estado cambia el estado del acuse', async () => {
  const services = buildServices();
  const app = createApp(services);
  const server = await listen(app);

  try {
    const payload = { Estado: 'En Reparto', Usuario: 'Tester' };
    const result = await requestJson(server, '/api/acuses/22/estado', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(result.status, 200);
    assert.deepEqual(result.json, { ID_Acuse: 22, Estado: 'En Reparto' });
    assert.deepEqual(services.calls[0], { op: 'changeEstado', id: '22', body: payload });
  } finally {
    server.close();
  }
});

test('DELETE /api/acuses/:id realiza la baja logica del acuse', async () => {
  const services = buildServices();
  const app = createApp(services);
  const server = await listen(app);

  try {
    const payload = { Usuario: 'Admin', Observacion: 'Anulado en prueba' };
    const result = await requestJson(server, '/api/acuses/30', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(result.status, 200);
    assert.deepEqual(result.json, { ok: true, ID_Acuse: 30 });
    assert.deepEqual(services.calls[0], { op: 'deactivateAcuse', id: '30', body: payload });
  } finally {
    server.close();
  }
});

test('POST /api/acuses bloquea origen externo no permitido', async () => {
  const services = buildServices();
  const app = createApp(services);
  const server = await listen(app);

  try {
    const result = await requestJson(server, '/api/acuses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://malicioso.example'
      },
      body: JSON.stringify({ Cod_Cliente: 'CLI-001' })
    });

    assert.equal(result.status, 403);
    assert.deepEqual(result.json, { error: 'Origen no permitido por CORS' });
    assert.equal(services.calls.length, 0);
  } finally {
    server.close();
  }
});

test('GET /tests/test-env.js no expone archivos internos por HTTP', async () => {
  const services = buildServices();
  const app = createApp(services);
  const server = await listen(app);

  try {
    const result = await requestText(server, '/tests/test-env.js');
    assert.equal(result.status, 404);
  } finally {
    server.close();
  }
});

test('GET /tmp_panel_before.json no expone archivos temporales por HTTP', async () => {
  const services = buildServices();
  const app = createApp(services);
  const server = await listen(app);

  try {
    const result = await requestText(server, '/tmp_panel_before.json');
    assert.equal(result.status, 404);
  } finally {
    server.close();
  }
});

test('isAllowedOrigin permite el mismo origen de la solicitud aunque no este en CORS_ORIGINS', () => {
  const allowedOrigins = serverIndexTest.buildAllowedOrigins('');
  const req = {
    get(name) {
      const normalized = String(name || '').toLowerCase();
      if (normalized === 'host') return '192.168.1.50:3000';
      return '';
    },
    protocol: 'http'
  };

  assert.equal(
    serverIndexTest.isAllowedOrigin('http://192.168.1.50:3000', allowedOrigins, req),
    true
  );
  assert.equal(
    serverIndexTest.isAllowedOrigin('http://malicioso.example:3000', allowedOrigins, req),
    false
  );
});

test('GET /api/acuses/:id devuelve 404 si el servicio informa no encontrado', async () => {
  const services = buildServices({
    acuses: {
      async getAcuse() {
        throw notFound('Acuse no encontrado');
      }
    }
  });
  const app = createApp(services);
  const server = await listen(app);

  try {
    const result = await requestJson(server, '/api/acuses/999');
    assert.equal(result.status, 404);
    assert.deepEqual(result.json, { error: 'Acuse no encontrado' });
  } finally {
    server.close();
  }
});

test('POST /api/acuses devuelve 400 si el servicio valida mal el payload', async () => {
  const services = buildServices({
    acuses: {
      async createAcuse() {
        throw badRequest('Cliente es obligatorio');
      }
    }
  });
  const app = createApp(services);
  const server = await listen(app);

  try {
    const result = await requestJson(server, '/api/acuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(result.status, 400);
    assert.deepEqual(result.json, { error: 'Cliente es obligatorio' });
  } finally {
    server.close();
  }
});
