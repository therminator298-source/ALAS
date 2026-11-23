const { pool, tables, config, withTransaction } = require('../db');
const { badRequest, notFound } = require('../errors');
const schema = require('./schemaService');
const {
  normalizeEstado,
  completedStates, cancelledStates, transitStates,
  isCompletedState, isTransitState, isCancelledState,
  statePlaceholders, buildDeliveredCondition, buildPendingCondition, buildAnnuladosCondition
} = require('./estadoUtils');
const { API_MAX_LIMIT, DASHBOARD_DEFAULT_PAGE_SIZE, VALID_YEAR_MIN, VALID_YEAR_MAX } = require('../config/constants');
const { cleanString, toNullableString, normalizeOffset, parsePositiveInt } = require('../utils/queryHelpers');

const MAX_LIMIT = API_MAX_LIMIT;

function normalizeLimit(value, fallback = 7) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_LIMIT);
}

function shouldFetchAllRows(query) {
  const raw = String(query?.all ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'all';
}

function parseYear(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < VALID_YEAR_MIN || parsed > VALID_YEAR_MAX) {
    throw badRequest('Anio invalido');
  }
  return parsed;
}

function parseMonth(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
    throw badRequest('Mes invalido');
  }
  return parsed;
}

function normalizeIsoDate(value, label = 'Fecha') {
  const text = cleanString(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw badRequest(`${label} invalida`);
  }
  return text;
}

function normalizeKpi(value) {
  const normalized = normalizeEstado(value).replace(/\s+/g, '_');

  if (!normalized) return '';
  if (['acuse', 'acuses', 'total', 'totales', 'todo', 'todos', 'all'].includes(normalized)) return 'acuses';
  if (['pendiente', 'pendientes'].includes(normalized)) return 'pendientes';
  if (['entregado', 'entregados', 'completado', 'completados'].includes(normalized)) return 'entregados';
  if (['en_transito', 'transito', 'en_reparto', 'reparto'].includes(normalized)) return 'en_transito';
  if (['anulado', 'anulados', 'cancelado', 'cancelados', 'annul', 'delete', 'deleted'].includes(normalized)) return 'anulados';
  return normalized;
}


async function optionalColumns(key, requiredColumns) {
  return schema.requireColumns(key, requiredColumns, { required: false });
}

function clienteJoin(info, alias = 'c') {
  const codColumn = schema.aliasColumn(info, alias, 'Cod_Cliente');
  return codColumn ? `LEFT JOIN ${info.table.ref} ${alias} ON ${codColumn} = a.Cod_Cliente` : '';
}

function zoneExpression(clienteInfo, acuseAlias = 'a', clienteAlias = 'c') {
  const values = [`NULLIF(TRIM(${acuseAlias}.Zona), '')`];
  const ciudad = schema.aliasColumn(clienteInfo, clienteAlias, 'Ciudad_Cliente');
  const zona = schema.aliasColumn(clienteInfo, clienteAlias, 'Zona_Cliente');

  if (ciudad) values.push(`NULLIF(TRIM(${ciudad}), '')`);
  if (zona) values.push(`NULLIF(TRIM(${zona}), '')`);

  values.push(`'Sin zona'`);
  return `COALESCE(${values.join(', ')})`;
}


function buildAcuseWhere(query, params, options = {}) {
  const where = options.includeInactive ? ['1 = 1'] : ['a.Activo = 1'];

  if (query.fecha) {
    where.push('a.Fecha_Emision = ?');
    params.push(query.fecha);
  }

  if (query.codCliente) {
    where.push('a.Cod_Cliente = ?');
    params.push(query.codCliente);
  }

  if (query.idRepartidor) {
    where.push('a.ID_Repartidor = ?');
    params.push(parsePositiveInt(query.idRepartidor, 'Repartidor'));
  }

  return where;
}

function clientSummarySelect(info, alias = 'c') {
  return [
    schema.selectColumn(info, alias, 'Nom_Cliente'),
    schema.selectColumn(info, alias, 'Ciudad_Cliente'),
    schema.selectColumn(info, alias, 'Zona_Cliente'),
    schema.selectColumn(info, alias, 'Direc_Cliente'),
    schema.selectColumn(info, alias, 'Ruc_Cliente')
  ].join(',\n        ');
}

function buildKpiCondition(kpi, params) {
  const normalizedKpi = normalizeKpi(kpi);
  if (normalizedKpi === 'acuses') return '1 = 1';

  if (normalizedKpi === 'entregados') {
    return buildDeliveredCondition('a', params);
  }

  if (normalizedKpi === 'en_transito') {
    const values = transitStates();
    params.push(...values);
    return `COALESCE(a.Estado, '') IN (${statePlaceholders(values)})`;
  }

  if (normalizedKpi === 'anulados') {
    return buildAnnuladosCondition('a', params);
  }

  if (normalizedKpi === 'pendientes') {
    const values = [...completedStates(), ...transitStates(), ...cancelledStates()];
    params.push(...values);
    return `COALESCE(a.Estado, '') NOT IN (${statePlaceholders(values)})`;
  }

  throw badRequest('KPI invalido');
}

function monthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

function sqlDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function parseSqlDate(value) {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function monthStartDate(value) {
  const date = parseSqlDate(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date) {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - offset);
  return value;
}

function endOfWeek(date) {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  value.setDate(value.getDate() + 6);
  return value;
}

function resolvePeriod(query = {}, now = new Date()) {
  const hasExplicitRange = cleanString(query.start) || cleanString(query.end);
  if (hasExplicitRange) {
    const start = normalizeIsoDate(query.start, 'Fecha inicial');
    const end = normalizeIsoDate(query.end, 'Fecha final');
    if (start > end) throw badRequest('Rango de fechas invalido');

    const anchor = cleanString(query.anchor)
      ? normalizeIsoDate(query.anchor, 'Fecha de referencia')
      : start;

    return {
      scope: cleanString(query.scope) === 'week' ? 'week' : 'month',
      start,
      end,
      anchor,
      year: Number(anchor.slice(0, 4)),
      month: Number(anchor.slice(5, 7))
    };
  }

  const year = parseYear(query.year || now.getFullYear());
  const month = parseMonth(query.month || now.getMonth() + 1);
  const range = monthRange(year, month);

  return {
    scope: 'month',
    start: range.start,
    end: range.end,
    anchor: range.start,
    year,
    month
  };
}

async function resolveSummaryPeriod(query = {}, now = new Date()) {
  const requestedScope = cleanString(query.scope).toLowerCase();
  if (requestedScope === 'all') {
    const [rows] = await pool.execute(
      `SELECT
          MIN(DATE(Fecha_Emision)) AS inicio,
          MAX(DATE(Fecha_Emision)) AS fin
         FROM ${tables.acuse}
        WHERE Activo = 1`
    );

    const fallbackStart = monthRange(now.getFullYear(), now.getMonth() + 1).start;
    const fallbackEnd = sqlDate(now);
    const start = rows[0]?.inicio ? sqlDate(parseSqlDate(rows[0].inicio)) : fallbackStart;
    const end = rows[0]?.fin ? sqlDate(parseSqlDate(rows[0].fin)) : fallbackEnd;
    const anchor = cleanString(query.anchor)
      ? normalizeIsoDate(query.anchor, 'Fecha de referencia')
      : end;

    return {
      scope: 'all',
      start,
      end,
      anchor,
      year: Number(end.slice(0, 4)),
      month: Number(end.slice(5, 7))
    };
  }

  return resolvePeriod(query, now);
}

function buildMonthLabel(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString('es-PY', { month: 'short' });
}

function buildDayLabel(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
}

function buildWeekdayLabel(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString('es-PY', { weekday: 'short' });
}

function buildWeekLabel(start, end) {
  const startDay = String(start.getDate()).padStart(2, '0');
  const endDay = String(end.getDate()).padStart(2, '0');
  const startMonth = buildMonthLabel(sqlDate(start));
  const endMonth = buildMonthLabel(sqlDate(end));

  if (start.getTime() === end.getTime()) {
    return `${startDay} ${startMonth}`;
  }

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}-${endDay} ${startMonth}`;
  }

  return `${startDay} ${startMonth}-${endDay} ${endMonth}`;
}

function buildWeeklySeries(rows, start, end) {
  const periodStart = parseSqlDate(start);
  const periodEnd = parseSqlDate(end);
  const buckets = [];
  const index = new Map();
  const cursor = startOfWeek(periodStart);

  while (cursor.getTime() <= periodEnd.getTime()) {
    const rawStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    const rawEnd = endOfWeek(rawStart);
    const effectiveStart = rawStart.getTime() < periodStart.getTime() ? periodStart : rawStart;
    const effectiveEnd = rawEnd.getTime() > periodEnd.getTime() ? periodEnd : rawEnd;
    const key = sqlDate(rawStart);
    const bucket = {
      semana: key,
      inicio: sqlDate(effectiveStart),
      fin: sqlDate(effectiveEnd),
      etiqueta: buildWeekLabel(effectiveStart, effectiveEnd),
      total: 0
    };

    buckets.push(bucket);
    index.set(key, bucket);
    cursor.setDate(cursor.getDate() + 7);
  }

  rows.forEach((row) => {
    const key = sqlDate(startOfWeek(parseSqlDate(row.fecha)));
    const bucket = index.get(key);
    if (bucket) bucket.total += Number(row.total || 0);
  });

  return buckets;
}

function buildMonthlySeries(rows, trendStart, end) {
  const values = new Map(
    rows.map((row) => [String(row.mes).slice(0, 10), Number(row.total || 0)])
  );
  const startDate = monthStartDate(trendStart);
  const lastDate = monthStartDate(end);
  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor.getTime() <= lastDate.getTime()) {
    const key = sqlDate(cursor);
    months.push({
      mes: key,
      etiqueta: buildMonthLabel(key),
      total: Number(values.get(key) || 0)
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

async function summary(query = {}) {
  const now = new Date();
  const period = await resolveSummaryPeriod(query, now);
  const { scope, year, month, start, end, anchor } = period;
  const anchorMonth = monthStartDate(anchor);
  const trendStart = scope === 'all'
    ? sqlDate(monthStartDate(start))
    : sqlDate(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() - 5, 1));
  const trendEnd = scope === 'all'
    ? end
    : sqlDate(endOfMonth(anchorMonth));
  const clienteInfo = await optionalColumns('clientes', ['Cod_Cliente']);
  const joinSql = clienteJoin(clienteInfo);
  const zonaExpr = zoneExpression(clienteInfo);

  const [estadoRows] = await pool.execute(
    `SELECT Estado, COUNT(*) AS total
       FROM ${tables.acuse} a
      WHERE a.Activo = 1
        AND a.Fecha_Emision BETWEEN ? AND ?
      GROUP BY Estado`,
    [start, end]
  );

  const [legacyAnuladosRows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM ${tables.acuse} a
      WHERE a.Activo = 0
        AND a.Fecha_Emision BETWEEN ? AND ?`,
    [start, end]
  );

  const [repartidorRows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM ${tables.repartidor}
      WHERE Estado_Repartidor IS NULL OR Estado_Repartidor <> 'Inactivo'`
  );

  const [zonasRows] = await pool.execute(
    `SELECT ${zonaExpr} AS zona, COUNT(*) AS total
       FROM ${tables.acuse} a
       ${joinSql}
      WHERE a.Activo = 1
        AND a.Fecha_Emision BETWEEN ? AND ?
      GROUP BY ${zonaExpr}
      ORDER BY total DESC, zona ASC
      LIMIT 8`,
    [start, end]
  );

  const [acusesDiaRows] = await pool.execute(
    `SELECT DATE(Fecha_Emision) AS fecha, COUNT(*) AS total
       FROM ${tables.acuse}
      WHERE Activo = 1
        AND Fecha_Emision BETWEEN ? AND ?
      GROUP BY DATE(Fecha_Emision)
      ORDER BY fecha ASC`,
    [start, end]
  );

  const [acusesMesRows] = await pool.execute(
    `SELECT DATE_FORMAT(Fecha_Emision, '%Y-%m-01') AS mes, COUNT(*) AS total
       FROM ${tables.acuse}
      WHERE Activo = 1
        AND Fecha_Emision BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(Fecha_Emision, '%Y-%m-01')
      ORDER BY mes ASC`,
    [trendStart, trendEnd]
  );

  const acusesPorDia = acusesDiaRows.map((row) => ({
    fecha: row.fecha,
    etiqueta: buildDayLabel(row.fecha),
    total: Number(row.total || 0)
  }));
  const acusesPorSemana = buildWeeklySeries(acusesDiaRows, start, end);
  const acusesPorMes = buildMonthlySeries(acusesMesRows, trendStart, trendEnd);

  const kpis = {
    pendientes: 0,
    entregados: 0,
    acuses: 0,
    en_transito: 0,
    anulados: 0,
    repartidores: Number(repartidorRows[0]?.total || 0)
  };

  estadoRows.forEach((row) => {
    const total = Number(row.total || 0);
    kpis.acuses += total;
    if (isCompletedState(row.Estado)) {
      kpis.entregados += total;
    } else if (isTransitState(row.Estado)) {
      kpis.en_transito += total;
    } else if (isCancelledState(row.Estado)) {
      kpis.anulados += total;
    } else {
      kpis.pendientes += total;
    }
  });

  const legacyAnulados = Number(legacyAnuladosRows[0]?.total || 0);
  if (legacyAnulados > 0) {
    kpis.anulados += legacyAnulados;
    kpis.acuses += legacyAnulados;
  }

  const donutTotal = Math.max(kpis.acuses, 0);
  const donut = {
    entregados: kpis.entregados,
    pendientes: kpis.pendientes,
    en_transito: kpis.en_transito,
    anulados: kpis.anulados,
    total: donutTotal,
    porcentajeEntregados: donutTotal > 0 ? Math.round((kpis.entregados / donutTotal) * 100) : 0,
    porcentajePendientes: donutTotal > 0 ? Math.round((kpis.pendientes / donutTotal) * 100) : 0,
    porcentajeTransito: donutTotal > 0 ? Math.round((kpis.en_transito / donutTotal) * 100) : 0,
    porcentajeAnulados: donutTotal > 0 ? Math.round((kpis.anulados / donutTotal) * 100) : 0
  };

  return {
    periodo: {
      scope,
      year,
      month,
      start,
      end,
      anchor
    },
    kpis,
    donut,
    porEstado: [
      ...estadoRows.map((row) => ({
        Estado: row.Estado,
        total: Number(row.total || 0)
      })),
      ...(legacyAnulados > 0 ? [{ Estado: 'Anulado', total: legacyAnulados }] : [])
    ],
    zonas: zonasRows.map((row) => ({
      zona: row.zona,
      total: Number(row.total || 0)
    })),
    acusesPorDia,
    acusesPorSemana,
    acusesPorMes
  };
}

async function calendarMonth(query = {}) {
  const now = new Date();
  const period = resolvePeriod(query, now);
  const { scope, year, month, start, end, anchor } = period;
  const deliveredParams = [];
  const deliveredCondition = buildDeliveredCondition('a', deliveredParams);

  const [rows] = await pool.execute(
    `SELECT
        DATE(a.Fecha_Emision) AS fecha,
        COUNT(*) AS total,
        SUM(CASE WHEN ${deliveredCondition} THEN 1 ELSE 0 END) AS entregados
       FROM ${tables.acuse} a
      WHERE a.Activo = 1
        AND a.Fecha_Emision BETWEEN ? AND ?
      GROUP BY DATE(a.Fecha_Emision)
      ORDER BY fecha ASC`,
    [...deliveredParams, start, end]
  );

  return {
    scope,
    year,
    month,
    start,
    end,
    anchor,
    days: rows.map((row) => {
      const total = Number(row.total || 0);
      const entregados = Number(row.entregados || 0);
      return {
        fecha: row.fecha,
        total,
        entregados,
        pendientes: Math.max(total - entregados, 0),
        estadoDia: total > 0 && entregados === total ? 'entregado' : 'pendiente'
      };
    })
  };
}

async function listAcusesByKpi(kpi, query = {}) {
  const normalizedKpi = normalizeKpi(kpi);
  const fetchAll = shouldFetchAllRows(query);
  const limit = fetchAll ? null : normalizeLimit(query.limit, DASHBOARD_DEFAULT_PAGE_SIZE);
  const offset = fetchAll ? 0 : normalizeOffset(query.offset);
  const clienteInfo = await optionalColumns('clientes', ['Cod_Cliente']);
  const joinSql = clienteJoin(clienteInfo);
  const params = [];
  const where = buildAcuseWhere(query, params, { includeInactive: normalizedKpi === 'anulados' });
  const kpiParams = [];
  const kpiCondition = buildKpiCondition(normalizedKpi, kpiParams);
  const whereSql = `WHERE ${where.join(' AND ')} AND ${kpiCondition}`;
  const estadoExpr = `CASE WHEN COALESCE(a.Activo, 1) = 0 THEN 'Anulado' ELSE a.Estado END`;

  const motivoAnulacionExpr = normalizedKpi === 'anulados'
    ? `(SELECT h.Observacion FROM ${tables.historial} h WHERE h.ID_Acuse = a.ID_Acuse AND h.Estado = 'Anulado' ORDER BY h.Fecha DESC LIMIT 1) AS Motivo_Anulacion`
    : 'NULL AS Motivo_Anulacion';
  const pagingSql = fetchAll ? '' : `LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.execute(
    `SELECT
        a.ID_Acuse,
        a.Nro_Acuse,
        a.Cod_Cliente,
        ${estadoExpr} AS Estado,
        a.Fecha_Emision,
        a.Fecha_Entrega,
        a.ID_Repartidor,
        a.Observacion,
        a.Zona,
        r.Codigo_Repartidor,
        r.Nombre_Repartidor,
        ${clientSummarySelect(clienteInfo)},
        COALESCE(d.Detalle_Items, 0) AS Detalle_Items,
        COALESCE(d.Detalle_Cantidad_Total, 0) AS Detalle_Cantidad_Total,
        ${motivoAnulacionExpr}
       FROM ${tables.acuse} a
       LEFT JOIN ${tables.repartidor} r ON r.ID = a.ID_Repartidor
       ${joinSql}
       LEFT JOIN (
         SELECT ID_Acuse, COUNT(*) AS Detalle_Items, SUM(Cantidad) AS Detalle_Cantidad_Total
           FROM ${tables.detalle}
          GROUP BY ID_Acuse
       ) d ON d.ID_Acuse = a.ID_Acuse
      ${whereSql}
      ORDER BY a.Fecha_Emision DESC, a.ID_Acuse DESC
      ${pagingSql}`,
    [...params, ...kpiParams]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM ${tables.acuse} a
       LEFT JOIN ${tables.repartidor} r ON r.ID = a.ID_Repartidor
       ${joinSql}
      ${whereSql}`,
    [...params, ...kpiParams]
  );

  const total = Number(countRows[0]?.total || 0);

  return {
    items: rows,
    total,
    limit: fetchAll ? total : limit,
    offset
  };
}

async function listRepartidores(query = {}) {
  const fetchAll = shouldFetchAllRows(query);
  const limit = fetchAll ? null : normalizeLimit(query.limit, DASHBOARD_DEFAULT_PAGE_SIZE);
  const offset = fetchAll ? 0 : normalizeOffset(query.offset);
  const params = [];
  const deliveredParams = [];
  const pendingParams = [];
  const where = buildAcuseWhere(query, params);
  const deliveredCondition = buildDeliveredCondition('a', deliveredParams);
  const pendingCondition = buildPendingCondition('a', pendingParams);
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const pagingSql = fetchAll ? '' : `LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.execute(
    `SELECT
        r.ID,
        r.Codigo_Repartidor,
        r.Nombre_Repartidor,
        COALESCE(MAX(NULLIF(a.Zona, '')), 'Sin zona') AS zona,
        COUNT(a.ID_Acuse) AS acuses,
        SUM(CASE WHEN a.ID_Acuse IS NOT NULL AND ${deliveredCondition} THEN 1 ELSE 0 END) AS entregas,
        SUM(CASE WHEN a.ID_Acuse IS NOT NULL AND ${pendingCondition} THEN 1 ELSE 0 END) AS pendientes
       FROM ${tables.repartidor} r
       LEFT JOIN ${tables.acuse} a ON a.ID_Repartidor = r.ID
      ${whereSql}
      GROUP BY r.ID, r.Codigo_Repartidor, r.Nombre_Repartidor
      HAVING COUNT(a.ID_Acuse) > 0
      ORDER BY acuses DESC, r.Nombre_Repartidor ASC
      ${pagingSql}`,
    [...deliveredParams, ...pendingParams, ...params]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM (
         SELECT r.ID
           FROM ${tables.repartidor} r
           LEFT JOIN ${tables.acuse} a ON a.ID_Repartidor = r.ID
          ${whereSql}
          GROUP BY r.ID
          HAVING COUNT(a.ID_Acuse) > 0
       ) repartidores_filtrados`,
    params
  );

  const total = Number(countRows[0]?.total || 0);

  return {
    items: rows.map((row) => {
      const acuses = Number(row.acuses || 0);
      const entregas = Number(row.entregas || 0);
      const pendientes = Number(row.pendientes || 0);
      return {
        ID: row.ID,
        Codigo_Repartidor: row.Codigo_Repartidor,
        Nombre_Repartidor: row.Nombre_Repartidor,
        zona: row.zona || 'Sin zona',
        acuses,
        entregas,
        pendientes,
        eficiencia: acuses > 0 ? Math.round((entregas / acuses) * 100) : 0
      };
    }),
    total,
    limit: fetchAll ? total : limit,
    offset
  };
}

async function logPrintAction(idAcuse, payload = {}) {
  const id = parsePositiveInt(idAcuse, 'ID_Acuse');
  const usuario = toNullableString(payload.Usuario) || config.defaultUser;
  const observacion = toNullableString(payload.Observacion) || 'Impresion del acuse';

  const [rows] = await pool.execute(
    `SELECT ID_Acuse, Estado
       FROM ${tables.acuse}
      WHERE ID_Acuse = ?
        AND Activo = 1
      LIMIT 1`,
    [id]
  );

  if (!rows.length) throw notFound('Acuse no encontrado');

  const estadoActual = rows[0].Estado;
  if (isCancelledState(estadoActual)) {
    throw badRequest('El acuse anulado no puede imprimirse');
  }
  const debePasarATransito = !isCompletedState(estadoActual) && !isTransitState(estadoActual);
  const estadoTransito = 'En Reparto';
  const observacionCambioEstado = 'Cambio automatico a en transito por impresion del acuse';

  return withTransaction(async (connection) => {
    if (debePasarATransito) {
      await connection.execute(
        `UPDATE ${tables.acuse}
            SET Estado = ?
          WHERE ID_Acuse = ?`,
        [estadoTransito, id]
      );

      await connection.execute(
        `INSERT INTO ${tables.historial} (ID_Acuse, Estado, Fecha, Usuario, Observacion)
         VALUES (?, ?, NOW(), ?, ?)`,
        [id, estadoTransito, usuario, observacionCambioEstado]
      );

      await connection.execute(
        `INSERT INTO ${tables.log} (ID_Acuse, Accion, FechaHora, Usuario, Observacion)
         VALUES (?, 'CAMBIO_ESTADO', NOW(), ?, ?)`,
        [id, usuario, observacionCambioEstado]
      );
    }

    await connection.execute(
      `INSERT INTO ${tables.log} (ID_Acuse, Accion, FechaHora, Usuario, Observacion)
       VALUES (?, 'IMPRIMIR', NOW(), ?, ?)`,
      [id, usuario, observacion]
    );

    return {
      ok: true,
      estado: debePasarATransito ? estadoTransito : estadoActual,
      actualizoEstado: debePasarATransito
    };
  });
}

module.exports = {
  summary,
  calendarMonth,
  listAcusesByKpi,
  listRepartidores,
  logPrintAction,
  __test__: {
    resolvePeriod,
    buildWeeklySeries,
    buildMonthlySeries,
    normalizeKpi,
    shouldFetchAllRows,
    sqlDate,
    parseSqlDate,
    startOfWeek,
    endOfWeek
  }
};
