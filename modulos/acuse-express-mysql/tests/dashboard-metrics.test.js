require('./test-env');

const test = require('node:test');
const assert = require('node:assert/strict');

const dashboardInteractiveService = require('../server/services/dashboardInteractiveService');
const { pool } = require('../server/db');

const {
  resolvePeriod,
  buildWeeklySeries,
  buildMonthlySeries,
  normalizeKpi,
  shouldFetchAllRows
} = dashboardInteractiveService.__test__;

test.after(async () => {
  await pool.end();
});

test('resolvePeriod arma un rango mensual desde year/month', () => {
  const period = resolvePeriod({ year: '2026', month: '4' }, new Date('2026-04-24T00:00:00'));

  assert.deepEqual(period, {
    scope: 'month',
    start: '2026-04-01',
    end: '2026-04-30',
    anchor: '2026-04-01',
    year: 2026,
    month: 4
  });
});

test('resolvePeriod conserva un rango semanal explicito', () => {
  const period = resolvePeriod({
    scope: 'week',
    anchor: '2026-04-24',
    start: '2026-04-20',
    end: '2026-04-26'
  });

  assert.deepEqual(period, {
    scope: 'week',
    start: '2026-04-20',
    end: '2026-04-26',
    anchor: '2026-04-24',
    year: 2026,
    month: 4
  });
});

test('buildWeeklySeries agrupa dias por semana y rellena semanas vacias', () => {
  const rows = [
    { fecha: '2026-04-21', total: 4 },
    { fecha: '2026-04-22', total: 1 },
    { fecha: '2026-04-30', total: 2 }
  ];

  const weeks = buildWeeklySeries(rows, '2026-04-13', '2026-04-30');

  assert.equal(weeks.length, 3);
  assert.deepEqual(
    weeks.map((item) => ({ inicio: item.inicio, fin: item.fin, total: item.total })),
    [
      { inicio: '2026-04-13', fin: '2026-04-19', total: 0 },
      { inicio: '2026-04-20', fin: '2026-04-26', total: 5 },
      { inicio: '2026-04-27', fin: '2026-04-30', total: 2 }
    ]
  );
});

test('buildMonthlySeries rellena meses faltantes con cero', () => {
  const rows = [
    { mes: '2026-03-01', total: 10 },
    { mes: '2026-05-01', total: 4 }
  ];

  const months = buildMonthlySeries(rows, '2026-03-01', '2026-05-31');

  assert.deepEqual(
    months.map((item) => ({ mes: item.mes, total: item.total })),
    [
      { mes: '2026-03-01', total: 10 },
      { mes: '2026-04-01', total: 0 },
      { mes: '2026-05-01', total: 4 }
    ]
  );
});

test('shouldFetchAllRows habilita la carga completa en los paneles del dashboard', () => {
  assert.equal(shouldFetchAllRows({ all: '1' }), true);
  assert.equal(shouldFetchAllRows({ all: 'true' }), true);
  assert.equal(shouldFetchAllRows({ all: 'all' }), true);
  assert.equal(shouldFetchAllRows({ all: '0' }), false);
  assert.equal(shouldFetchAllRows({}), false);
});

test('normalizeKpi acepta aliases de anulacion y transito usados por el dashboard', () => {
  assert.equal(normalizeKpi('annul'), 'anulados');
  assert.equal(normalizeKpi('anulado'), 'anulados');
  assert.equal(normalizeKpi('delete'), 'anulados');
  assert.equal(normalizeKpi('En Tránsito'), 'en_transito');
  assert.equal(normalizeKpi('total'), 'acuses');
});
