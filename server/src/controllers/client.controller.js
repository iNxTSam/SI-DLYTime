'use strict';

const fs = require('fs');
const clientService = require('../services/client.service');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  requireFields,
  asInt,
  asString,
  asEmail,
} = require('../utils/validate');
const { badRequest } = require('../utils/httpError');

const searchClients = asyncHandler(async (req, res) => {
  const term = req.query.q ? String(req.query.q).trim() : undefined;
  res.json(await clientService.searchClients(term));
});

const getClient = asyncHandler(async (req, res) => {
  const numeroDocumento = asInt(req.params.numeroDocumento, 'numeroDocumento', { min: 1 });
  const client = await clientService.findByDocument(numeroDocumento);
  if (!client) return res.status(404).json({ message: 'Cliente no encontrado.' });
  return res.json(client);
});

const createClient = asyncHandler(async (req, res) => {
  const body = req.body || {};

  requireFields(body, [
    'numeroDocumento',
    'idTipoIdentificacion',
    'Nombres',
    'Apellidos',
    'idGenero',
    'correo',
  ]);

  const client = await clientService.createClient({
    numeroDocumento: asInt(body.numeroDocumento, 'numeroDocumento', { min: 1 }),
    idTipoIdentificacion: asInt(body.idTipoIdentificacion, 'idTipoIdentificacion', { min: 1 }),
    nombres: asString(body.Nombres, 'Nombres', { max: 30 }),
    apellidos: asString(body.Apellidos, 'Apellidos', { max: 30 }),
    idGenero: asInt(body.idGenero, 'idGenero', { min: 1 }),
    correo: asEmail(body.correo),
    telefono: body.telefono ? String(body.telefono).slice(0, 15) : null,
    idEstadoPersona: body.estadoPersona ? Number(body.estadoPersona) : 1,
  });

  res.status(201).json({ message: 'Cliente registrado con éxito.', ...client });
});

const updateClient = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const numeroDocumento = asInt(body.numeroDocumento, 'numeroDocumento', { min: 1 });

  const result = await clientService.updateClient(numeroDocumento, {
    idTipoIdentificacion: body.idTipoIdentificacion,
    nombres: body.Nombres,
    apellidos: body.Apellidos,
    idGenero: body.idGenero,
    correo: body.correo,
    telefono: body.telefono,
    idEstadoPersona: body.estadoPersona,
  });

  if (result.updated === 0) {
    throw badRequest('No se proporcionaron datos para actualizar.', 'NOTHING_TO_UPDATE');
  }

  res.json({ success: true, message: 'Se procesó correctamente.' });
});

const uploadClinicalRecord = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw badRequest('No se ha enviado un archivo PDF.', 'FILE_REQUIRED');
  }

  try {
    const numeroDocumento = asInt(
      (req.body || {}).numeroDocumento,
      'numeroDocumento',
      { min: 1 }
    );

    const record = await clientService.addClinicalRecord(
      numeroDocumento,
      req.file.filename
    );

    res.status(201).json({ message: 'Historial clínico agregado con éxito.', ...record });
  } catch (error) {
    // Si la validacion falla despues de que multer escribio el archivo, se
    // elimina para no dejar PDFs huerfanos en disco.
    fs.unlink(req.file.path, () => {});
    throw error;
  }
});

const listClinicalRecords = asyncHandler(async (req, res) => {
  const numeroDocumento = asInt(req.params.numeroDocumento, 'numeroDocumento', { min: 1 });
  res.json(await clientService.listClinicalRecords(numeroDocumento));
});

module.exports = {
  searchClients,
  getClient,
  createClient,
  updateClient,
  uploadClinicalRecord,
  listClinicalRecords,
};
