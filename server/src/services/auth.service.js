'use strict';

const bcryptjs = require('bcryptjs');
const db = require('../config/db');
const { config } = require('../config/env');
const { signToken } = require('../utils/jwt');
const { conflict, unauthorized } = require('../utils/httpError');
const { ROLES } = require('../utils/roles');

/**
 * Contador de intentos fallidos por correo. El codigo original usaba una
 * unica variable global, asi que el bloqueo de una cuenta afectaba a todos
 * los usuarios del sistema.
 */
const failedAttempts = new Map();

function registerAttempts(correo) {
  const current = failedAttempts.get(correo) || 0;
  const next = current + 1;
  failedAttempts.set(correo, next);
  return next;
}

function clearAttempts(correo) {
  failedAttempts.delete(correo);
}

function attemptsLeft(correo) {
  const current = failedAttempts.get(correo) || 0;
  return Math.max(0, config.security.loginMaxAttempts - current);
}

async function findByEmail(correo) {
  return db.one(
    `SELECT numeroDocumento, clave, idRol, idEstadoPersona, block_account, correo
     FROM persona
     WHERE correo = ?`,
    [correo]
  );
}

async function register(payload) {
  const {
    numeroDocumento,
    idTipoIdentificacion,
    nombre,
    apellido,
    idGenero,
    correo,
    clave,
  } = payload;

  const existing = await db.one(
    'SELECT numeroDocumento FROM persona WHERE numeroDocumento = ? OR correo = ?',
    [numeroDocumento, correo]
  );

  if (existing) {
    throw conflict('El número de documento o correo ya existe.', 'USER_EXISTS');
  }

  const hashedPassword = await bcryptjs.hash(clave, 10);

  await db.query(
    `INSERT INTO persona
       (numeroDocumento, idRol, idTipoIdentificacion, Nombres, Apellidos,
        idGenero, correo, clave, idEstadoPersona)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      numeroDocumento,
      // El registro publico siempre crea clientes: nunca se confia en el rol
      // enviado por el navegador.
      ROLES.CLIENTE,
      idTipoIdentificacion,
      nombre,
      apellido,
      idGenero,
      correo,
      hashedPassword,
    ]
  );

  return { numeroDocumento, correo };
}

async function login({ correo, clave }) {
  const user = await findByEmail(correo);

  // Respuesta identica para correo inexistente y contrasena incorrecta:
  // evita enumerar cuentas.
  const invalidCredentials = () =>
    unauthorized('Correo o contraseña incorrecta.', 'INVALID_CREDENTIALS');

  if (!user) throw invalidCredentials();

  const blockedUntil = user.block_account ? new Date(user.block_account) : null;
  if (Number(user.idEstadoPersona) === 3 && blockedUntil && blockedUntil > new Date()) {
    const minutes = Math.ceil((blockedUntil.getTime() - Date.now()) / 60000);
    throw unauthorized(
      `Cuenta bloqueada, intenta de nuevo en ${minutes} minuto(s).`,
      'ACCOUNT_LOCKED'
    );
  }

  const passwordMatches = await bcryptjs.compare(clave, user.clave);

  if (!passwordMatches) {
    const attempts = registerAttempts(correo);

    if (attempts >= config.security.loginMaxAttempts) {
      const blockUntil = new Date(
        Date.now() + config.security.loginBlockMinutes * 60 * 1000
      );
      await db.query(
        'UPDATE persona SET idEstadoPersona = 3, block_account = ? WHERE numeroDocumento = ?',
        [blockUntil, user.numeroDocumento]
      );
      clearAttempts(correo);
      throw unauthorized(
        `Cuenta bloqueada por demasiados intentos. Intenta en ${config.security.loginBlockMinutes} minuto(s).`,
        'ACCOUNT_LOCKED'
      );
    }

    const left = attemptsLeft(correo);
    throw unauthorized(
      `Correo o contraseña incorrecta. Intentos restantes: ${left}.`,
      'INVALID_CREDENTIALS'
    );
  }

  clearAttempts(correo);

  if (Number(user.idEstadoPersona) === 3 || user.block_account) {
    await db.query(
      'UPDATE persona SET idEstadoPersona = 1, block_account = NULL WHERE numeroDocumento = ?',
      [user.numeroDocumento]
    );
  }

  const token = signToken({
    id: user.numeroDocumento,
    correo: user.correo,
    rol: Number(user.idRol),
  });

  return {
    token,
    rol: Number(user.idRol),
    id: user.numeroDocumento,
    message: 'Inicio de sesion exitoso',
  };
}

module.exports = {
  register,
  login,
  // exportados para pruebas
  clearAttempts,
  failedAttempts,
};
