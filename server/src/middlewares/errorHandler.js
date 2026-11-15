'use strict';

const multer = require('multer');

/**
 * Traduce errores conocidos (multer incluido) a una respuesta JSON coherente.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      message:
        error.code === 'LIMIT_FILE_SIZE'
          ? 'El archivo supera el tamaño máximo permitido.'
          : `Error al subir el archivo: ${error.message}`,
      code: error.code,
    });
  }

  const status = Number(error.status) || 500;

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }

  const body = {
    message:
      status >= 500
        ? 'Error interno del servidor. Intenta de nuevo más tarde.'
        : error.message,
  };
  if (error.code) body.code = error.code;

  return res.status(status).json(body);
}

module.exports = { errorHandler };
