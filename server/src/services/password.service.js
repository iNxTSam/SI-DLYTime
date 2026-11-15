'use strict';

const crypto = require('crypto');
const bcryptjs = require('bcryptjs');
const db = require('../config/db');
const { config } = require('../config/env');
const { badRequest } = require('../utils/httpError');

const codeAttempts = new Map();

function attemptsFor(correo) {
  return codeAttempts.get(correo) || 0;
}

function registerAttempt(correo) {
  const next = attemptsFor(correo) + 1;
  codeAttempts.set(correo, next);
  return next;
}

/**
 * Genera un codigo de recuperacion y lo guarda. Devuelve null si el correo no
 * existe, para que el controlador responda igual en ambos casos.
 */
async function requestReset(correo) {
  const user = await db.one(
    'SELECT numeroDocumento FROM persona WHERE correo = ?',
    [correo]
  );

  if (!user) return null;

  // 6 digitos con un generador criptografico (Math.random no es seguro).
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const expires = new Date(
    Date.now() + config.security.passwordResetTtlMinutes * 60 * 1000
  );

  await db.query(
    'UPDATE persona SET reset_code = ?, reset_expires = ? WHERE numeroDocumento = ?',
    [code, expires, user.numeroDocumento]
  );

  codeAttempts.delete(correo);

  return {
    code,
    numeroDocumento: user.numeroDocumento,
    expires,
  };
}

async function assertValidCode(correo, code) {
  if (attemptsFor(correo) >= config.security.passwordResetMaxAttempts) {
    throw badRequest(
      'Demasiados intentos con este código. Solicita uno nuevo.',
      'RESET_ATTEMPTS_EXCEEDED'
    );
  }

  const row = await db.one(
    'SELECT reset_expires FROM persona WHERE correo = ? AND reset_code = ?',
    [correo, code]
  );

  if (!row) {
    registerAttempt(correo);
    throw badRequest('Código inválido o correo no registrado.', 'INVALID_RESET_CODE');
  }

  const expiresAt = new Date(row.reset_expires);
  if (Number.isNaN(expiresAt.getTime()) || Date.now() > expiresAt.getTime()) {
    throw badRequest('El código ha expirado.', 'RESET_CODE_EXPIRED');
  }

  return true;
}

async function changePassword(correo, code, password) {
  // Se revalida el codigo: el endpoint original cambiaba la contrasena sin
  // comprobar el codigo ni su expiracion.
  await assertValidCode(correo, code);

  const hashedPassword = await bcryptjs.hash(password, 10);

  const result = await db.query(
    `UPDATE persona
     SET clave = ?, reset_code = NULL, reset_expires = NULL, idEstadoPersona = 1, block_account = NULL
     WHERE correo = ? AND reset_code = ?`,
    [hashedPassword, correo, code]
  );

  if (!result || result.affectedRows === 0) {
    throw badRequest('No se pudo actualizar la contraseña.', 'PASSWORD_UPDATE_FAILED');
  }

  codeAttempts.delete(correo);
  return true;
}

function clearCodeAttempts() {
  codeAttempts.clear();
}

module.exports = {
  requestReset,
  assertValidCode,
  changePassword,
  clearCodeAttempts,
};
