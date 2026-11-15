'use strict';

const appointmentService = require('../services/appointment.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireFields, asInt, asDate } = require('../utils/validate');
const { forbidden } = require('../utils/httpError');
const { ROLES } = require('../utils/roles');

const listAppointments = asyncHandler(async (req, res) => {
  const { q, fecha, idTipoConsulta } = req.query;

  res.json(
    await appointmentService.listAppointments({
      term: q ? String(q).trim() : undefined,
      fecha: fecha ? String(fecha) : undefined,
      idTipoConsulta: idTipoConsulta ? Number(idTipoConsulta) : undefined,
    })
  );
});

const listClientAppointments = asyncHandler(async (req, res) => {
  const id = asInt(req.query.id, 'id', { min: 1 });

  // Un cliente solo puede consultar sus propias citas.
  if (Number(req.user.rol) === ROLES.CLIENTE && Number(req.user.id) !== id) {
    throw forbidden('Solo puedes consultar tus propias citas.');
  }

  res.json(await appointmentService.listAppointmentsByClient(id));
});

const createAppointment = asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Un cliente siempre agenda para si mismo, sin importar lo que envie el
  // navegador.
  const cliente =
    Number(req.user.rol) === ROLES.CLIENTE
      ? Number(req.user.id)
      : asInt(body.NumeroDocumentoCliente, 'NumeroDocumentoCliente', { min: 1 });

  requireFields(
    {
      ...body,
      NumeroDocumentoCliente: cliente,
    },
    ['NumeroDocumentoCliente', 'NumeroDocumentoOftalmologo', 'idHorario', 'idTipoConsulta']
  );

  const appointment = await appointmentService.createAppointment({
    numeroDocumentoCliente: cliente,
    numeroDocumentoOftalmologo: asInt(
      body.NumeroDocumentoOftalmologo,
      'NumeroDocumentoOftalmologo',
      { min: 1 }
    ),
    idHorario: asInt(body.idHorario, 'idHorario', { min: 1 }),
    idTipoConsulta: asInt(body.idTipoConsulta, 'idTipoConsulta', { min: 1 }),
  });

  res.status(201).json({ message: 'Cita agregada exitosamente.', ...appointment });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const body = req.body || {};

  requireFields(body, ['idCita', 'idEstadoCita', 'idHorario', 'idEstadoHorario']);

  const result = await appointmentService.cancelAppointment({
    idCita: asInt(body.idCita, 'idCita', { min: 1 }),
    idEstadoCita: asInt(body.idEstadoCita, 'idEstadoCita', { min: 1 }),
    idHorario: asInt(body.idHorario, 'idHorario', { min: 1 }),
    idEstadoHorario: asInt(body.idEstadoHorario, 'idEstadoHorario', { min: 1 }),
  });

  res.status(201).json({ message: 'Cita cancelada.', ...result });
});

const updateAppointment = asyncHandler(async (req, res) => {
  const body = req.body || {};

  requireFields(body, ['idCita', 'idHorario', 'idTipoConsulta']);

  const result = await appointmentService.updateAppointment({
    idCita: asInt(body.idCita, 'idCita', { min: 1 }),
    idHorario: asInt(body.idHorario, 'idHorario', { min: 1 }),
    idTipoConsulta: asInt(body.idTipoConsulta, 'idTipoConsulta', { min: 1 }),
    idHorario1: body.idHorario1 ? asInt(body.idHorario1, 'idHorario1', { min: 1 }) : null,
  });

  res.status(201).json({ message: 'Cita actualizada', ...result });
});

const listAvailableSlots = asyncHandler(async (req, res) => {
  const fecha = asDate(req.query.fecha, 'fecha');
  const isoDate = fecha.toISOString().slice(0, 10);
  res.json(await appointmentService.listAvailableSlots(isoDate));
});

const listEmployees = asyncHandler(async (req, res) => {
  res.json(await appointmentService.listEmployees());
});

const getClient = asyncHandler(async (req, res) => {
  const numeroDocumento = asInt(
    req.query.NumeroDocumentoCliente,
    'NumeroDocumentoCliente',
    { min: 1 }
  );
  res.json(await appointmentService.getClientByDocument(numeroDocumento));
});

const listConsultationTypes = asyncHandler(async (req, res) => {
  res.json(await appointmentService.listConsultationTypes());
});

module.exports = {
  listAppointments,
  listClientAppointments,
  createAppointment,
  cancelAppointment,
  updateAppointment,
  listAvailableSlots,
  listEmployees,
  getClient,
  listConsultationTypes,
};
