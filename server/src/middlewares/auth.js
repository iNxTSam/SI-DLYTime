'use strict';

const { verifyToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/httpError');
const { ROLE_NAMES } = require('../utils/roles');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * Exige un JWT valido y deja los datos del usuario en req.user.
 */
function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(unauthorized('Debes iniciar sesión para acceder a este recurso.', 'TOKEN_REQUIRED'));
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Si viene un token valido lo adjunta, pero no bloquea la peticion.
 */
function optionalAuthenticate(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch (error) {
      req.user = null;
    }
  }
  return next();
}

/**
 * Restringe el acceso a los roles indicados. Debe usarse despues de authenticate.
 * @param {...number} roles
 */
function authorize(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) return next(unauthorized());
    const rol = Number(req.user.rol);
    if (!roles.includes(rol)) {
      return next(
        forbidden(
          `Acción permitida solo para: ${roles.map((r) => ROLE_NAMES[r] || r).join(', ')}.`
        )
      );
    }
    return next();
  };
}

module.exports = { authenticate, optionalAuthenticate, authorize };
