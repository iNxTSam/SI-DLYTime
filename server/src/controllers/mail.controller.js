'use strict';

const mailService = require('../services/mail.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { asEmail, asString, requireFields } = require('../utils/validate');

const sendPasswordCode = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const correo = asEmail(body.to ?? body.correo, 'to');
  const subject = body.subject || 'Restablecer password';

  await mailService.sendPasswordResetCode(correo, subject);

  res.status(200).json({
    message:
      'Si el correo está registrado, enviaremos un código de restablecimiento.',
  });
});

const sendRegistrationCode = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const correo = asEmail(body.to ?? body.correo, 'to');
  const subject = body.subject || 'Codigo para Registro';

  await mailService.sendRegistrationCode(correo, subject);

  res.status(200).json({
    message: 'Código de verificación enviado.',
  });
});

const sendSupport = asyncHandler(async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['email', 'message']);

  await mailService.sendSupportRequest({
    email: asEmail(body.email, 'email'),
    problem: body.problem ? String(body.problem).slice(0, 120) : 'General',
    message: asString(body.message, 'message', { max: 2000 }),
  });

  res.status(200).json({ message: 'Correo enviado con éxito.' });
});

module.exports = { sendPasswordCode, sendRegistrationCode, sendSupport };
