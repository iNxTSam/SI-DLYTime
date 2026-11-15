'use strict';

const bcryptjs = require('bcryptjs');
const db = require('../config/db');
const { conflict } = require('../utils/httpError');
const { ROLES } = require('../utils/roles');

const PUBLIC_COLUMNS = `
  persona.numeroDocumento,
  persona.idTipoIdentificacion,
  persona.Nombres,
  persona.Apellidos,
  persona.idGenero,
  persona.correo,
  persona.telefono,
  persona.fechaNacimiento,
  persona.direccion,
  persona.idEstadoPersona,
  persona.idRol
`;

async function searchEmployees(term) {
  let sql = `
    SELECT ${PUBLIC_COLUMNS},
           genero.nombre AS nombreGenero,
           estadopersona.nombre AS nombreEstado
    FROM persona
    JOIN genero ON persona.idGenero = genero.idGenero
    JOIN estadopersona ON persona.idEstadoPersona = estadopersona.idEstado
    WHERE persona.idRol = ?`;
  const params = [ROLES.EMPLEADO];

  if (term) {
    // El codigo original usaba el alias inexistente "p.numeroDocumento" y la
    // consulta fallaba con cualquier busqueda.
    sql += ' AND (persona.numeroDocumento LIKE ? OR persona.Nombres LIKE ? OR persona.Apellidos LIKE ?)';
    params.push(`%${term}%`, `%${term}%`, `%${term}%`);
  }

  sql += ' ORDER BY persona.Apellidos, persona.Nombres';
  return db.query(sql, params);
}

async function createEmployee(payload) {
  const {
    numeroDocumento,
    idTipoIdentificacion,
    nombres,
    apellidos,
    idGenero,
    correo,
    telefono,
    clave,
    idEstadoPersona = 1,
  } = payload;

  const existing = await db.one(
    'SELECT numeroDocumento FROM persona WHERE numeroDocumento = ? OR correo = ?',
    [numeroDocumento, correo]
  );

  if (existing) {
    throw conflict('El número de documento o correo ya existe.', 'USER_EXISTS');
  }

  const hashedPassword = await bcryptjs.hash(clave, 10);

  const result = await db.query(
    `INSERT INTO persona
      (numeroDocumento, idRol, idTipoIdentificacion, Nombres, Apellidos,
       idGenero, correo, telefono, clave, idEstadoPersona)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      numeroDocumento,
      ROLES.EMPLEADO,
      idTipoIdentificacion,
      nombres,
      apellidos,
      idGenero,
      correo,
      telefono,
      hashedPassword,
      idEstadoPersona,
    ]
  );

  return { insertId: result.insertId, numeroDocumento };
}

async function updateEmployee(numeroDocumento, payload) {
  const {
    idTipoIdentificacion,
    nombres,
    apellidos,
    idGenero,
    correo,
    telefono,
    idEstadoPersona,
  } = payload;

  const duplicated = await db.one(
    'SELECT numeroDocumento FROM persona WHERE correo = ? AND numeroDocumento <> ?',
    [correo, numeroDocumento]
  );

  if (duplicated) {
    throw conflict('El correo ya esta registrado por otra persona.', 'EMAIL_IN_USE');
  }

  const result = await db.query(
    `UPDATE persona
     SET idTipoIdentificacion = ?, Nombres = ?, Apellidos = ?, idGenero = ?,
         correo = ?, telefono = ?, idEstadoPersona = ?
     WHERE numeroDocumento = ?`,
    [
      idTipoIdentificacion,
      nombres,
      apellidos,
      idGenero,
      correo,
      telefono,
      idEstadoPersona,
      numeroDocumento,
    ]
  );

  return { updated: result.affectedRows };
}

module.exports = { searchEmployees, createEmployee, updateEmployee };
