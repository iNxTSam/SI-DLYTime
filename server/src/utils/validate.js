'use strict';

const { badRequest } = require('./httpError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Valida que los campos existan y no esten vacios.
 * @param {Record<string, unknown>} source
 * @param {string[]} fields
 */
function requireFields(source, fields) {
  const payload = source || {};
  const missing = fields.filter((field) => isEmpty(payload[field]));
  if (missing.length > 0) {
    throw badRequest(
      `Faltan campos obligatorios: ${missing.join(', ')}.`,
      'MISSING_FIELDS'
    );
  }
}

function asString(value, field, options = {}) {
  const { min = 1, max = 255, trim = true } = options;
  if (isEmpty(value)) throw badRequest(`El campo ${field} es obligatorio.`, 'INVALID_FIELD');
  const text = String(trim ? String(value).trim() : value);
  if (text.length < min || text.length > max) {
    throw badRequest(
      `El campo ${field} debe tener entre ${min} y ${max} caracteres.`,
      'INVALID_FIELD'
    );
  }
  return text;
}

function asInt(value, field, options = {}) {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;
  if (isEmpty(value)) throw badRequest(`El campo ${field} es obligatorio.`, 'INVALID_FIELD');
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw badRequest(`El campo ${field} debe ser un número entero.`, 'INVALID_FIELD');
  }
  if (number < min || number > max) {
    throw badRequest(`El campo ${field} está fuera de rango.`, 'INVALID_FIELD');
  }
  return number;
}

function asEmail(value, field = 'correo') {
  if (isEmpty(value)) throw badRequest(`El campo ${field} es obligatorio.`, 'INVALID_FIELD');
  const email = String(value).trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw badRequest(`El campo ${field} no es un correo válido.`, 'INVALID_EMAIL');
  }
  return email;
}

function asEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw badRequest(
      `El campo ${field} debe ser uno de: ${allowed.join(', ')}.`,
      'INVALID_FIELD'
    );
  }
  return value;
}

function asDate(value, field) {
  if (isEmpty(value)) throw badRequest(`El campo ${field} es obligatorio.`, 'INVALID_FIELD');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`El campo ${field} no es una fecha válida.`, 'INVALID_DATE');
  }
  return date;
}

module.exports = {
  EMAIL_REGEX,
  isEmpty,
  requireFields,
  asString,
  asInt,
  asEmail,
  asEnum,
  asDate,
};
