'use strict';

const nodemailer = require('nodemailer');
const { config } = require('../config/env');
const { serviceUnavailable } = require('./httpError');

let transporter = null;

function isMailConfigured() {
  return Boolean(config.mail.user && config.mail.appPassword);
}

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.mail.user,
        pass: config.mail.appPassword,
      },
    });
  }
  return transporter;
}

/**
 * Envia un correo. Si no hay credenciales configuradas responde 503 en lugar
 * de romper la peticion con un error generico de nodemailer.
 */
async function sendMail({ to, subject, text, html }) {
  const client = getTransporter();
  if (!client) {
    throw serviceUnavailable(
      'El envío de correo no está configurado en este entorno.',
      'MAIL_NOT_CONFIGURED'
    );
  }
  return client.sendMail({
    from: config.mail.from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
}

/** Solo para pruebas: descarta el transporter cacheado. */
function resetMailer() {
  transporter = null;
}

module.exports = { sendMail, isMailConfigured, resetMailer };
