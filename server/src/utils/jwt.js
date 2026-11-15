'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { unauthorized } = require('./httpError');

function signToken({ id, correo, rol }) {
  return jwt.sign({ id, correo, rol }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw unauthorized('La sesión expiró. Vuelve a iniciar sesión.', 'TOKEN_EXPIRED');
    }
    throw unauthorized('Token inválido.', 'TOKEN_INVALID');
  }
}

module.exports = { signToken, verifyToken };
