'use strict';

const db = require('../config/db');

function listIdentificationTypes() {
  return db.query(
    'SELECT idTipoIdentificacion, nombre FROM tipoidentificacion ORDER BY idTipoIdentificacion'
  );
}

function listGenders() {
  return db.query('SELECT idGenero, nombre FROM genero ORDER BY idGenero');
}

function listPersonStatuses() {
  return db.query('SELECT idEstado, nombre FROM estadopersona ORDER BY idEstado');
}

module.exports = { listIdentificationTypes, listGenders, listPersonStatuses };
