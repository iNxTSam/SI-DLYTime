'use strict';

const bcryptjs = require('bcryptjs');
const db = require('../config/db');
const { notFound } = require('../utils/httpError');

async function getProfile(numeroDocumento) {
  const profile = await db.one(
    `SELECT persona.numeroDocumento,
            persona.Nombres,
            persona.Apellidos,
            genero.nombre AS genero,
            persona.idGenero,
            persona.correo,
            persona.telefono,
            persona.fechaNacimiento,
            persona.direccion,
            persona.idRol
     FROM persona
     INNER JOIN genero ON genero.idGenero = persona.idGenero
     WHERE persona.numeroDocumento = ?`,
    [numeroDocumento]
  );

  if (!profile) throw notFound('No se encontró el usuario.', 'USER_NOT_FOUND');
  return profile;
}

async function updateProfile(numeroDocumento, { nombre, apellido, telefono, password }) {
  const assignments = [];
  const params = [];

  if (nombre !== undefined) {
    assignments.push('Nombres = ?');
    params.push(nombre);
  }
  if (apellido !== undefined) {
    assignments.push('Apellidos = ?');
    params.push(apellido);
  }
  if (telefono !== undefined) {
    assignments.push('telefono = ?');
    params.push(telefono);
  }
  if (password) {
    // Antes se re-hasheaba siempre: guardar el perfil sin cambiar la clave
    // rompia la peticion.
    assignments.push('clave = ?');
    params.push(await bcryptjs.hash(password, 10));
  }

  if (assignments.length === 0) {
    return { updated: 0 };
  }

  params.push(numeroDocumento);

  const result = await db.query(
    `UPDATE persona SET ${assignments.join(', ')} WHERE numeroDocumento = ?`,
    params
  );

  if (result.affectedRows === 0) {
    throw notFound('Usuario no encontrado.', 'USER_NOT_FOUND');
  }

  return { updated: result.affectedRows };
}

async function setPassword(numeroDocumento, password) {
  const hashedPassword = await bcryptjs.hash(password, 10);

  const result = await db.query(
    'UPDATE persona SET clave = ?, reset_code = NULL, reset_expires = NULL WHERE numeroDocumento = ?',
    [hashedPassword, numeroDocumento]
  );

  if (result.affectedRows === 0) {
    throw notFound('Usuario no encontrado.', 'USER_NOT_FOUND');
  }

  return { updated: result.affectedRows };
}

module.exports = { getProfile, updateProfile, setPassword };
