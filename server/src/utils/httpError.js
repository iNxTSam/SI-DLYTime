'use strict';

/**
 * Error de aplicacion con codigo HTTP y codigo de negocio opcional.
 */
class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

const badRequest = (message, code) => new HttpError(400, message, code);
const unauthorized = (message = 'No autorizado.', code) =>
  new HttpError(401, message, code);
const forbidden = (message = 'No tiene permisos para esta acción.', code) =>
  new HttpError(403, message, code);
const notFound = (message = 'Recurso no encontrado.', code) =>
  new HttpError(404, message, code);
const conflict = (message, code) => new HttpError(409, message, code);
const unprocessable = (message, code) => new HttpError(422, message, code);
const serviceUnavailable = (message, code) => new HttpError(503, message, code);

module.exports = {
  HttpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  serviceUnavailable,
};
