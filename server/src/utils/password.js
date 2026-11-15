'use strict';

const { badRequest } = require('./httpError');

const MIN_LENGTH = 8;
const STRICT_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Regla usada en los formularios donde la persona elige su propia contrasena.
 */
function assertStrongPassword(password, field = 'password') {
  if (typeof password !== 'string' || !STRICT_REGEX.test(password)) {
    throw badRequest(
      `La ${field} debe tener mínimo ${MIN_LENGTH} caracteres, al menos una mayúscula y un número.`,
      'WEAK_PASSWORD'
    );
  }
  return password;
}

module.exports = { assertStrongPassword, MIN_LENGTH };
