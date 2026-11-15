'use strict';

const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireFields, asInt, asString, asEmail } = require('../utils/validate');
const { assertStrongPassword } = require('../utils/password');

const register = asyncHandler(async (req, res) => {
  const body = req.body || {};

  requireFields(body, [
    'numeroDocumento',
    'idTipoIdentificacion',
    'nombre',
    'apellido',
    'idGenero',
    'correo',
    'clave',
  ]);

  await authService.register({
    numeroDocumento: asInt(body.numeroDocumento, 'numeroDocumento', { min: 1 }),
    idTipoIdentificacion: asInt(body.idTipoIdentificacion, 'idTipoIdentificacion', { min: 1 }),
    idGenero: asInt(body.idGenero, 'idGenero', { min: 1 }),
    nombre: asString(body.nombre, 'nombre', { max: 30 }),
    apellido: asString(body.apellido, 'apellido', { max: 30 }),
    correo: asEmail(body.correo),
    clave: assertStrongPassword(body.clave, 'contraseña'),
  });

  res.status(201).json({ message: 'Empleado registrado con éxito.' });
});

const login = asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Se mantienen los nombres correo_i / password_i por compatibilidad con el
  // cliente web y la app movil ya desplegadas.
  const correo = asEmail(body.correo_i ?? body.correo, 'correo_i');
  const clave = body.password_i ?? body.password;

  if (!clave || typeof clave !== 'string') {
    return res.status(400).json({ message: 'La contraseña es obligatoria.' });
  }

  const result = await authService.login({ correo, clave });
  return res.status(200).json(result);
});

module.exports = { register, login };
