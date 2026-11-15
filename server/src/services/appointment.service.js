'use strict';

const db = require('../config/db');
const { conflict, notFound, badRequest } = require('../utils/httpError');
const { ROLES } = require('../utils/roles');

const APPOINTMENT_SELECT = `
  SELECT
    detallecita.idCita,
    horario.fecha,
    horario.hora,
    horario.estadoHorario,
    CONCAT(horario.fecha, ' ', horario.hora) AS fechaHora,
    CONCAT(p1.Nombres, ' ', p1.Apellidos) AS nombreCliente,
    CONCAT(p2.Nombres, ' ', p2.Apellidos) AS nombreEmpleado,
    tipoconsulta.nombre AS tipoConsulta,
    detallecita.direccion,
    estadocita.idEstadocita AS idEstadoCita,
    estadocita.nombre AS estadoCita,
    detallecita.idHorarios
  FROM cita
  INNER JOIN detallecita ON detallecita.idCita = cita.idCita
  INNER JOIN horario ON horario.idHorarios = detallecita.idHorarios
  INNER JOIN persona p1 ON cita.NumeroDocumentoCliente = p1.numeroDocumento
  INNER JOIN persona p2 ON cita.NumeroDocumentoOftalmologo = p2.numeroDocumento
  INNER JOIN tipoconsulta ON tipoconsulta.idtipoConsulta = detallecita.idTipoConsulta
  INNER JOIN estadocita ON estadocita.idEstadocita = detallecita.idEstadoCita
`;

async function listAppointments({ term, fecha, idTipoConsulta } = {}) {
  let sql = `${APPOINTMENT_SELECT} WHERE 1 = 1`;
  const params = [];

  if (term) {
    sql += ' AND (p1.numeroDocumento LIKE ? OR p2.numeroDocumento LIKE ?)';
    params.push(`%${term}%`, `%${term}%`);
  }
  if (fecha) {
    sql += ' AND horario.fecha = ?';
    params.push(fecha);
  }
  if (idTipoConsulta) {
    sql += ' AND tipoconsulta.idtipoConsulta = ?';
    params.push(idTipoConsulta);
  }

  sql += ' ORDER BY cita.idCita DESC';
  return db.query(sql, params);
}

async function listAppointmentsByClient(numeroDocumento) {
  return db.query(
    `${APPOINTMENT_SELECT} WHERE p1.numeroDocumento = ? ORDER BY cita.idCita DESC`,
    [numeroDocumento]
  );
}

/**
 * Crea cita + detalle + diagnostico y marca el horario como ocupado.
 * Todo ocurre en una transaccion.
 */
async function createAppointment({ numeroDocumentoCliente, numeroDocumentoOftalmologo, idHorario, idTipoConsulta }) {
  const direccion = 'Cra. 78k #35A - 82sur, Bogota';
  const estadoCita = 1;

  return db.withTransaction(async (connection) => {
    const [diagnostico] = await connection.execute(
      'INSERT INTO diagnostico (descripcion) VALUES (?)',
      ['']
    );
    const idDiagnostico = diagnostico.insertId;

    const [horarios] = await connection.execute(
      'UPDATE horario SET estadoHorario = 2 WHERE idHorarios = ? AND estadoHorario = 1',
      [idHorario]
    );

    if (horarios.affectedRows === 0) {
      throw conflict('El horario seleccionado ya no está disponible.', 'SLOT_TAKEN');
    }

    const [cita] = await connection.execute(
      'INSERT INTO cita (NumeroDocumentoCliente, NumeroDocumentoOftalmologo) VALUES (?, ?)',
      [numeroDocumentoCliente, numeroDocumentoOftalmologo]
    );

    await connection.execute(
      `INSERT INTO detallecita
        (idCita, idDiagnostico, idHorarios, idTipoConsulta, idEstadoCita, direccion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cita.insertId, idDiagnostico, idHorario, idTipoConsulta, estadoCita, direccion]
    );

    return { idCita: cita.insertId };
  });
}

async function cancelAppointment({ idCita, idEstadoCita, idHorario, idEstadoHorario }) {
  // Estado 3 = atendida/cancelada, estado 2 = ocupado en el horario.
  if (Number(idEstadoCita) === 3 && Number(idEstadoHorario) === 2) {
    throw conflict('No se puede activar la cita porque ya fue atendida.', 'APPOINTMENT_ATTENDED');
  }

  const nuevoEstadoHorario = Number(idEstadoHorario) === 2 ? 1 : 2;
  const nuevoEstadoCita = Number(idEstadoCita) === 3 ? 1 : 3;

  return db.withTransaction(async (connection) => {
    const [horarios] = await connection.execute(
      'UPDATE horario SET estadoHorario = ? WHERE idHorarios = ?',
      [nuevoEstadoHorario, idHorario]
    );

    if (horarios.affectedRows === 0) {
      throw notFound('No se encontró el horario indicado.', 'SLOT_NOT_FOUND');
    }

    const [detalle] = await connection.execute(
      'UPDATE detallecita SET idEstadoCita = ? WHERE idCita = ?',
      [nuevoEstadoCita, idCita]
    );

    if (detalle.affectedRows === 0) {
      throw notFound('No se encontró la cita indicada.', 'APPOINTMENT_NOT_FOUND');
    }

    return { idCita, estadoCita: nuevoEstadoCita, estadoHorario: nuevoEstadoHorario };
  });
}

async function updateAppointment({ idCita, idHorario, idTipoConsulta, idHorario1 }) {
  return db.withTransaction(async (connection) => {
    const [detalle] = await connection.execute(
      'UPDATE detallecita SET idHorarios = ?, idTipoConsulta = ? WHERE idCita = ?',
      [idHorario, idTipoConsulta, idCita]
    );

    if (detalle.affectedRows === 0) {
      throw notFound('No se encontró la cita indicada.', 'APPOINTMENT_NOT_FOUND');
    }

    await connection.execute(
      'UPDATE horario SET estadoHorario = 2 WHERE idHorarios = ?',
      [idHorario]
    );

    if (idHorario1) {
      await connection.execute(
        'UPDATE horario SET estadoHorario = 1 WHERE idHorarios = ?',
        [idHorario1]
      );
    }

    return { idCita };
  });
}

async function listAvailableSlots(fecha) {
  return db.query(
    'SELECT idHorarios AS id, hora FROM horario WHERE fecha = ? AND estadoHorario = 1 ORDER BY hora',
    [fecha]
  );
}

function listEmployees() {
  return db.query(
    `SELECT CONCAT(Nombres, ' ', Apellidos) AS nombre, numeroDocumento
     FROM persona WHERE idRol = ? ORDER BY Apellidos`,
    [ROLES.EMPLEADO]
  );
}

async function getClientByDocument(numeroDocumento) {
  const client = await db.one(
    `SELECT CONCAT(Nombres, ' ', Apellidos) AS nombre, numeroDocumento, correo
     FROM persona WHERE idRol = ? AND numeroDocumento = ?`,
    [ROLES.CLIENTE, numeroDocumento]
  );
  if (!client) {
    throw notFound('No se encontró un cliente con ese documento.', 'CLIENT_NOT_FOUND');
  }
  return client;
}

function listConsultationTypes() {
  return db.query('SELECT idtipoConsulta, nombre FROM tipoconsulta ORDER BY nombre');
}

module.exports = {
  listAppointments,
  listAppointmentsByClient,
  createAppointment,
  cancelAppointment,
  updateAppointment,
  listAvailableSlots,
  listEmployees,
  getClientByDocument,
  listConsultationTypes,
};
