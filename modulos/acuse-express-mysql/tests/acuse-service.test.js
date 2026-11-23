require('./test-env');

const test = require('node:test');
const assert = require('node:assert/strict');

const acuseService = require('../server/services/acuseService');
const { pool } = require('../server/db');

const {
  mapEstado,
  summarizeEstadoRows,
  normalizeDetalle,
  shouldFetchAllRows
} = acuseService.__test__;

test.after(async () => {
  await pool.end();
});

test('mapEstado normaliza variantes de estado hacia los valores operativos', () => {
  assert.equal(mapEstado('en tránsito'), 'En Reparto');
  assert.equal(mapEstado('terminado'), 'Entregado');
  assert.equal(mapEstado('anulado'), 'Anulado');
  assert.equal(mapEstado('pendiente'), 'Pendiente');
});

test('shouldFetchAllRows reconoce el flag para devolver el listado completo', () => {
  assert.equal(shouldFetchAllRows({ all: '1' }), true);
  assert.equal(shouldFetchAllRows({ all: 'true' }), true);
  assert.equal(shouldFetchAllRows({ all: 'all' }), true);
  assert.equal(shouldFetchAllRows({ all: '0' }), false);
  assert.equal(shouldFetchAllRows({}), false);
});

test('normalizeDetalle soporta el payload legacy de una sola mercaderia', () => {
  const detalle = normalizeDetalle({
    Cod_Mercaderia: 'MAT-001',
    Cantidad: '3',
    UM: 'UN',
    Nota: 'Fragil'
  });

  assert.deepEqual(detalle, [{
    Cod_Mercaderia: 'MAT-001',
    Cantidad: 3,
    UM: 'UN',
    Nota: 'Fragil'
  }]);
});

test('normalizeDetalle filtra lineas sin mercaderia y mantiene solo items validos', () => {
  const detalle = normalizeDetalle({
    detalles: [
      { Cod_Mercaderia: 'MAT-001', Cantidad: 2, UM: 'CJ', Nota: 'Ok' },
      { Cod_Mercaderia: '   ', Cantidad: 5, UM: 'CJ', Nota: 'Ignorar' }
    ]
  });

  assert.equal(detalle.length, 1);
  assert.equal(detalle[0].Cod_Mercaderia, 'MAT-001');
});

test('summarizeEstadoRows acumula pendiente, transito, entregado y anulado', () => {
  const summary = summarizeEstadoRows([
    { Estado: 'Pendiente', total: 3 },
    { Estado: 'En Reparto', total: 2 },
    { Estado: 'Entregado', total: 5 },
    { Estado: 'Anulado', total: 1 }
  ]);

  assert.deepEqual(summary, {
    pendiente: 3,
    en_transito: 2,
    entregado: 5,
    anulado: 1
  });
});
