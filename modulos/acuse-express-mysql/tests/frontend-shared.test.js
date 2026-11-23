const test = require('node:test');
const assert = require('node:assert/strict');

const alasShared = require('../js/shared/alas-shared.js');

test('normalize helpers limpian acentos y generan lookups estables', () => {
  assert.equal(alasShared.text.normalize(' En Tránsito '), 'en transito');
  assert.equal(alasShared.text.normalizeLookup('En Tránsito'), 'en_transito');
  assert.equal(alasShared.text.normalizeLookup('Total-de Acuses'), 'total_de_acuses');
});

test('normalize estado key unifica estados operativos del frontend', () => {
  assert.equal(alasShared.estado.normalizeKey('Entregado'), 'entregado');
  assert.equal(alasShared.estado.normalizeKey('en reparto'), 'en_transito');
  assert.equal(alasShared.estado.normalizeKey('cancelada'), 'anulado');
  assert.equal(alasShared.estado.normalizeKey('Pendiente'), 'pendiente');
});

test('format helpers mantienen salidas seguras para cantidad y fechas', () => {
  assert.equal(alasShared.format.formatQuantity(12), '12');
  assert.equal(alasShared.format.formatQuantity('nope'), '0');
  assert.equal(
    alasShared.format.formatDateTime('2026-04-29 13:53:54', {
      locale: 'es-PY',
      includeTime: true,
      timeJoiner: ' - ',
      timeSuffix: ' hs'
    }),
    '29/04/2026 - 13:53 hs'
  );
});
