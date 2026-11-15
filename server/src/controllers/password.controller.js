'use strict';

const passwordService = require('../services/password.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { asEmail, requireFields } = require('../utils/validate');
const { assertStrongPassword } = require('../utils/password');

const validateCode = asyncHandler(async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['correo', 'code']);

  const correo = asEmail(body.correo, 'correo');
  await passwordService.assertValidCode(correo, String(body.code).trim());

  res.status(200).json({ valid: true });
});

const changePassword = asyncHandler(async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['correo', 'codigo', 'password']);

  const correo = asEmail(body.correo, 'correo');
  const password = assertStrongPassword(body.password, 'contraseña');

  await passwordService.changePassword(correo, String(body.codigo).trim(), password);

  res.status(200).json({ message: 'Contraseña cambiada con éxito.' });
});

module.exports = { validateCode, changePassword };
