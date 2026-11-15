'use strict';

/**
 * Envuelve un handler async para que cualquier rechazo llegue al errorHandler
 * en lugar de dejar la peticion colgada.
 */
function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
