'use strict';

const employeeService = require('../services/employee.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireFields, asInt, asString, asEmail } = require('../utils/validate');
const { assertStrongPassword } = require('../utils/password');

const searchEmployees = asyncHandler(async (req, res) => {
  const term = req.query.q ? String(req.query.q).trim() : undefined;
  res.json(await employeeService.searchEmployees(term));
});

const createEmployee = asyncHandler(async (req, res) => {
  const body = req.body || {};

  requireFields(body, [
    'numeroDocumento',
    'idTipoIdentificacion',
    'Nombres',
    'Apellidos',
    'idGenero',
    'correo',
    'clave',
  ]);

  const employee = await employeeService.createEmployee({
    numeroDocumento: asInt(body.numeroDocumento, 'numeroDocumento', { min: 1 }),
    idTipoIdentificacion: asInt(body.idTipoIdentificacion, 'idTipoIdentificacion', { min: 1 }),
    nombres: asString(body.Nombres, 'Nombres', { max: 30 }),
    apellidos: asString(body.Apellidos, 'Apellidos', { max: 30 }),
    idGenero: asInt(body.idGenero, 'idGenero', { min: 1 }),
    correo: asEmail(body.correo),
    telefono: body.telefono ? String(body.telefono).slice(0, 15) : null,
    clave: assertStrongPassword(body.clave, 'contraseña'),
    idEstadoPersona: body.idEstadoPersona ? Number(body.idEstadoPersona) : 1,
  });

  res.status(201).json({ message: 'Empleado registrado con éxito.', ...employee });
});

const updateEmployee = asyncHandler(async (req, res) => {
  const body = req.body || {};

  requireFields(body, [
    'numeroDocumento',
    'idTipoIdentificacion',
    'Nombres',
    'Apellidos',
    'idGenero',
    'correo',
  ]);

  const numeroDocumento = asInt(body.numeroDocumento, 'numeroDocumento', { min: 1 });

  await employeeService.updateEmployee(numeroDocumento, {
    idTipoIdentificacion: asInt(body.idTipoIdentificacion, 'idTipoIdentificacion', { min: 1 }),
    nombres: asString(body.Nombres, 'Nombres', { max: 30 }),
    apellidos: asString(body.Apellidos, 'Apellidos', { max: 30 }),
    idGenero: asInt(body.idGenero, 'idGenero', { min: 1 }),
    correo: asEmail(body.correo),
    telefono: body.telefono ? String(body.telefono).slice(0, 15) : null,
    idEstadoPersona: body.idEstadoPersona ? Number(body.idEstadoPersona) : 1,
  });

  res.json({ success: true, message: 'Se procesó correctamente.' });
});

module.exports = { searchEmployees, createEmployee, updateEmployee };
