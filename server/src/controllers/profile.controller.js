'use strict';

const profileService = require('../services/profile.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireFields, asInt, asString } = require('../utils/validate');
const { assertStrongPassword } = require('../utils/password');
const { forbidden } = require('../utils/httpError');
const { ROLES } = require('../utils/roles');

/**
 * Un usuario solo puede consultar su propio perfil; el administrador puede
 * consultar cualquiera. Antes bastaba con cambiar ?id= en la URL.
 */
function assertCanAccess(req, numeroDocumento) {
  const rol = Number(req.user?.rol);
  if (rol === ROLES.ADMIN) return;
  if (Number(req.user?.id) !== Number(numeroDocumento)) {
    throw forbidden('Solo puedes acceder a tu propio perfil.');
  }
}

const getProfile = asyncHandler(async (req, res) => {
  const numeroDocumento = asInt(
    req.query.id ?? req.user.id,
    'id',
    { min: 1 }
  );

  assertCanAccess(req, numeroDocumento);

  res.json(await profileService.getProfile(numeroDocumento));
});

const updateProfile = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const numeroDocumento = asInt(body.numeroDocumento, 'numeroDocumento', { min: 1 });

  assertCanAccess(req, numeroDocumento);

  const password = body.password
    ? assertStrongPassword(body.password, 'contraseña')
    : undefined;

  const result = await profileService.updateProfile(numeroDocumento, {
    nombre: body.nombre ? asString(body.nombre, 'nombre', { max: 30 }) : undefined,
    apellido: body.apellido ? asString(body.apellido, 'apellido', { max: 30 }) : undefined,
    telefono: body.telefono !== undefined ? String(body.telefono).slice(0, 15) : undefined,
    password,
  });

  res.status(200).json({
    message: result.updated > 0 ? 'Datos actualizados' : 'No había cambios por guardar',
  });
});

const setUserPassword = asyncHandler(async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['numeroDocumento', 'password']);

  const numeroDocumento = asInt(body.numeroDocumento, 'numeroDocumento', { min: 1 });
  const password = assertStrongPassword(body.password, 'contraseña');

  await profileService.setPassword(numeroDocumento, password);

  res.status(200).json({ message: 'Datos actualizados' });
});

module.exports = { getProfile, updateProfile, setUserPassword };
