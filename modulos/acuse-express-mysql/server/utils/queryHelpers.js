'use strict';

const { badRequest } = require('../errors');

function cleanString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function toNullableString(value) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function normalizeOffset(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return parsed;
}

function parsePositiveInt(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) throw badRequest(`${label} invalido`);
  return parsed;
}

module.exports = { cleanString, toNullableString, normalizeOffset, parsePositiveInt };
