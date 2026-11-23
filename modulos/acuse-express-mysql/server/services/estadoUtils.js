'use strict';

const { config } = require('../db');
const { cleanString } = require('../utils/queryHelpers');

function normalizeEstado(value) {
  return cleanString(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/_/g, ' ')
    .toLowerCase();
}

function completedStates() {
  return Array.from(new Set([
    config.estados.completado,
    'Entregado',
    'entregado',
    'completado',
    'terminado'
  ].filter(Boolean)));
}

function cancelledStates() {
  return ['Anulado', 'anulado', 'cancelado', 'cancelada'];
}

function transitStates() {
  return ['En Reparto', 'En Transito', 'En Tránsito', 'en reparto', 'en transito', 'transito', 'reparto'];
}

function isCompletedState(value) {
  return ['entregado', 'completado', 'terminado'].includes(normalizeEstado(value));
}

function isTransitState(value) {
  return ['en transito', 'en reparto', 'transito', 'reparto'].includes(normalizeEstado(value));
}

function isCancelledState(value) {
  return ['anulado', 'cancelado', 'cancelada'].includes(normalizeEstado(value));
}

function mapEstado(value) {
  const normalized = normalizeEstado(value);
  if (['entregado', 'terminado', 'completado'].includes(normalized)) return 'Entregado';
  if (['en transito', 'en reparto', 'transito', 'reparto'].includes(normalized)) return 'En Reparto';
  if (['anulado', 'anulada', 'cancelado', 'cancelada'].includes(normalized)) return 'Anulado';
  if (['pendiente', 'hoy', 'proxima', 'proximo'].includes(normalized)) return 'Pendiente';
  return config.estados[cleanString(value)] || cleanString(value);
}

function estadoUiKey(value) {
  const normalized = normalizeEstado(value);
  if (['entregado', 'terminado', 'completado'].includes(normalized)) return 'entregado';
  if (['en transito', 'en reparto', 'transito', 'reparto'].includes(normalized)) return 'en_transito';
  if (['anulado', 'anulada', 'cancelado', 'cancelada'].includes(normalized)) return 'anulado';
  return 'pendiente';
}

function statePlaceholders(values) {
  return values.map(() => '?').join(', ');
}

function terminadoSql(alias, params) {
  const values = completedStates();
  params.push(...values);
  return `(COALESCE(${alias}.Estado, '') IN (${statePlaceholders(values)}))`;
}

function pendienteSql(alias, params) {
  const values = [
    ...completedStates(),
    ...cancelledStates(),
    'En Reparto', 'En Transito', 'En Tránsito', 'en reparto', 'en transito', 'transito', 'reparto'
  ];
  params.push(...values);
  return `(COALESCE(${alias}.Estado, '') NOT IN (${statePlaceholders(values)}))`;
}

function anuladoLegacySql(alias, params) {
  const values = cancelledStates();
  params.push(...values);
  return `(COALESCE(${alias}.Activo, 1) = 0 OR COALESCE(${alias}.Estado, '') IN (${statePlaceholders(values)}))`;
}

function buildDeliveredCondition(alias, params) {
  const values = completedStates();
  params.push(...values);
  return `COALESCE(${alias}.Estado, '') IN (${statePlaceholders(values)})`;
}

function buildPendingCondition(alias, params) {
  const values = [...completedStates(), ...transitStates(), ...cancelledStates()];
  params.push(...values);
  return `COALESCE(${alias}.Estado, '') NOT IN (${statePlaceholders(values)})`;
}

function buildAnnuladosCondition(alias, params) {
  const values = cancelledStates();
  params.push(...values);
  return `(COALESCE(${alias}.Activo, 1) = 0 OR COALESCE(${alias}.Estado, '') IN (${statePlaceholders(values)}))`;
}

function summarizeEstadoRows(rows) {
  const summary = { pendiente: 0, en_transito: 0, entregado: 0, anulado: 0 };
  (rows || []).forEach((row) => {
    const key = estadoUiKey(row.Estado);
    summary[key] += Number(row.total || 0);
  });
  return summary;
}

module.exports = {
  cleanString,
  normalizeEstado,
  completedStates,
  cancelledStates,
  transitStates,
  isCompletedState,
  isTransitState,
  isCancelledState,
  mapEstado,
  estadoUiKey,
  statePlaceholders,
  terminadoSql,
  pendienteSql,
  anuladoLegacySql,
  buildDeliveredCondition,
  buildPendingCondition,
  buildAnnuladosCondition,
  summarizeEstadoRows
};
