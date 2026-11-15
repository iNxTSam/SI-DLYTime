'use strict';

const bcryptjs = require('bcryptjs');
const db = require('../config/db');
const { conflict, notFound } = require('../utils/httpError');
const { ROLES } = require('../utils/roles');

/**
 * Columnas publicas de una persona. Antes se enviaba `persona.*`, lo que
 * exponia la contrasena hasheada, el codigo de recuperacion y la fecha de
 * bloqueo al navegador.
 */
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

async function searchClients(term) {
  let sql = `
    SELECT ${PUBLIC_COLUMNS},
           genero.nombre AS nombreGenero,
           estadopersona.nombre AS nombreEstado
    FROM persona
    JOIN genero ON persona.idGenero = genero.idGenero
    JOIN estadopersona ON persona.idEstadoPersona = estadopersona.idEstado
    WHERE persona.idRol = ?`;
  const params = [ROLES.CLIENTE];

  if (term) {
    sql += ' AND (persona.numeroDocumento LIKE ? OR persona.Nombres LIKE ? OR persona.Apellidos LIKE ?)';
    params.push(`%${term}%`, `%${term}%`, `%${term}%`);
  }

  sql += ' ORDER BY persona.Apellidos, persona.Nombres';
  return db.query(sql, params);
}

async function findByDocument(numeroDocumento) {
  return db.one(
    `SELECT ${PUBLIC_COLUMNS} FROM persona WHERE numeroDocumento = ?`,
    [numeroDocumento]
  );
}

async function createClient(payload) {
  const {
    numeroDocumento,
    idTipoIdentificacion,
    nombres,
    apellidos,
    idGenero,
    correo,
    telefono,
    idEstadoPersona = 1,
  } = payload;

  const existing = await db.one(
    'SELECT numeroDocumento FROM persona WHERE numeroDocumento = ? OR correo = ?',
    [numeroDocumento, correo]
  );

  if (existing) {
    throw conflict('El número de documento o correo ya existe.', 'USER_EXISTS');
  }

  // Comportamiento heredado: la clave inicial del cliente es su documento.
  const hashedPassword = await bcryptjs.hash(String(numeroDocumento), 10);

  const result = await db.query(
    `INSERT INTO persona
      (numeroDocumento, idRol, idTipoIdentificacion, Nombres, Apellidos,
       idGenero, correo, telefono, clave, idEstadoPersona)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      numeroDocumento,
      ROLES.CLIENTE,
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

async function updateClient(numeroDocumento, changes) {
  const editable = {
    idTipoIdentificacion: 'idTipoIdentificacion',
    Nombres: 'Nombres',
    Apellidos: 'Apellidos',
    idGenero: 'idGenero',
    correo: 'correo',
    telefono: 'telefono',
    idEstadoPersona: 'idEstadoPersona',
  };

  const assignments = [];
  const params = [];

  const requested = {
    idTipoIdentificacion: changes.idTipoIdentificacion,
    Nombres: changes.nombres ?? changes.Nombres,
    Apellidos: changes.apellidos ?? changes.Apellidos,
    idGenero: changes.idGenero,
    correo: changes.correo,
    telefono: changes.telefono,
    idEstadoPersona: changes.idEstadoPersona,
  };

  for (const [key, column] of Object.entries(editable)) {
    const value = requested[key];
    if (value !== undefined && value !== null && value !== '') {
      assignments.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (assignments.length === 0) {
    return { updated: 0 };
  }

  if (requested.correo) {
    const duplicated = await db.one(
      'SELECT numeroDocumento FROM persona WHERE correo = ? AND numeroDocumento <> ?',
      [requested.correo, numeroDocumento]
    );
    if (duplicated) {
      throw conflict('El correo ya esta registrado por otra persona.', 'EMAIL_IN_USE');
    }
  }

  params.push(numeroDocumento);

  const result = await db.query(
    `UPDATE persona SET ${assignments.join(', ')} WHERE numeroDocumento = ?`,
    params
  );

  return { updated: result.affectedRows };
}

async function addClinicalRecord(numeroDocumento, fileName) {
  const client = await db.one(
    'SELECT numeroDocumento FROM persona WHERE numeroDocumento = ?',
    [numeroDocumento]
  );

  if (!client) throw notFound('El cliente no existe.', 'CLIENT_NOT_FOUND');

  const result = await db.query(
    'INSERT INTO clientes_historial (numeroDocumento, descripcion, archivoPDF) VALUES (?, ?, ?)',
    [numeroDocumento, 'Historial clinico', fileName]
  );

  const description = `Historial Clinico #${result.insertId} - ${numeroDocumento} - ${new Date().toLocaleDateString('es-CO')}`;

  await db.query(
    'UPDATE clientes_historial SET descripcion = ? WHERE idHistorial = ?',
    [description, result.insertId]
  );

  return { idHistorial: result.insertId, descripcion: description, archivoPDF: fileName };
}

async function listClinicalRecords(numeroDocumento) {
  return db.query(
    `SELECT idHistorial, numeroDocumento, descripcion, archivoPDF, fecha
     FROM clientes_historial
     WHERE numeroDocumento = ?
     ORDER BY fecha DESC`,
    [numeroDocumento]
  );
}

module.exports = {
  searchClients,
  findByDocument,
  createClient,
  updateClient,
  addClinicalRecord,
  listClinicalRecords,
};
