'use strict';

const crypto = require('crypto');
const { config } = require('../config/env');
const { sendMail, isMailConfigured } = require('../utils/mailer');
const { badRequest } = require('../utils/httpError');
const passwordService = require('./password.service');

/** Codigos de verificacion de registro: correo -> { code, expires, attempts } */
const registrationCodes = new Map();

const TTL_MS = config.security.passwordResetTtlMinutes * 60 * 1000;
const MAX_ATTEMPTS = config.security.passwordResetMaxAttempts;

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function devLog(label, correo, code) {
  if (!isMailConfigured() && config.env !== 'production') {
    console.warn(`[mail:dev] ${label} para ${correo}: ${code}`);
  }
}

function issueRegistrationCode(correo) {
  const code = generateCode();
  registrationCodes.set(correo, {
    code,
    expires: Date.now() + TTL_MS,
    attempts: 0,
  });
  return code;
}

async function sendRegistrationCode(correo, subject = 'Codigo para Registro') {
  const code = issueRegistrationCode(correo);

  if (isMailConfigured()) {
    await sendMail({
      to: correo,
      subject,
      text: `Hola. Tu codigo de registro es: ${code}. Expira en ${config.security.passwordResetTtlMinutes} minutos.`,
    });
  } else {
    devLog('Codigo de registro', correo, code);
  }

  return { sent: true, expiresInMinutes: config.security.passwordResetTtlMinutes };
}

function verifyRegistrationCode(correo, code) {
  const entry = registrationCodes.get(correo);

  if (!entry) {
    throw badRequest('Solicita un código de registro primero.', 'REGISTRATION_CODE_MISSING');
  }
  if (Date.now() > entry.expires) {
    registrationCodes.delete(correo);
    throw badRequest('El código expiró. Solicita uno nuevo.', 'REGISTRATION_CODE_EXPIRED');
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    registrationCodes.delete(correo);
    throw badRequest('Demasiados intentos. Solicita un código nuevo.', 'REGISTRATION_CODE_LOCKED');
  }
  if (String(code) !== entry.code) {
    entry.attempts += 1;
    throw badRequest('Código incorrecto.', 'REGISTRATION_CODE_INVALID');
  }

  registrationCodes.delete(correo);
  return true;
}

async function sendPasswordResetCode(correo, subject = 'Restablecer password') {
  const reset = await passwordService.requestReset(correo);

  // Respuesta uniforme: no se revela si el correo esta registrado o no.
  if (!reset) {
    return { sent: true };
  }

  if (isMailConfigured()) {
    await sendMail({
      to: correo,
      subject,
      text: `Hola. Tu codigo de restablecimiento es: ${reset.code}. Expira en ${config.security.passwordResetTtlMinutes} minutos.`,
    });
  } else {
    devLog('Codigo de restablecimiento', correo, reset.code);
  }

  return { sent: true };
}

async function sendSupportRequest({ email, problem, message }) {
  const destination = config.mail.supportTo;

  if (!destination) {
    throw badRequest('El correo de soporte no está configurado.', 'SUPPORT_NOT_CONFIGURED');
  }

  if (!isMailConfigured()) {
    console.warn('[mail:dev] Solicitud de soporte (no enviada):', { email, problem, message });
    return { sent: true };
  }

  await sendMail({
    to: destination,
    subject: `Solicitud de soporte - ${problem || 'General'}`,
    text: `Correo de contacto: ${email || 'no indicado'}\nTipo de problema: ${problem || 'no indicado'}\nMensaje: ${message || ''}`,
    html: `<p><strong>Correo de contacto:</strong> ${email || 'no indicado'}</p>
           <p><strong>Tipo de problema:</strong> ${problem || 'no indicado'}</p>
           <p><strong>Mensaje:</strong></p><p>${message || ''}</p>`,
  });

  return { sent: true };
}

function clearRegistrationCodes() {
  registrationCodes.clear();
}

module.exports = {
  sendRegistrationCode,
  verifyRegistrationCode,
  sendPasswordResetCode,
  sendSupportRequest,
  clearRegistrationCodes,
};
