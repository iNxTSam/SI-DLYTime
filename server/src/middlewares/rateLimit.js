'use strict';

const rateLimit = require('express-rate-limit');

const disabled = () => process.env.RATE_LIMIT_DISABLED === '1';

function buildLimiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: disabled,
    message: { message, code: 'RATE_LIMITED' },
  });
}

const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Demasiados intentos de inicio de sesión. Espera unos minutos.',
  skipSuccessfulRequests: true,
});

const passwordResetLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  message: 'Demasiadas solicitudes de recuperación de contraseña. Espera unos minutos.',
});

const mailLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Demasiados correos solicitados. Espera unos minutos.',
});

const apiLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: 'Demasiadas peticiones. Espera un momento.',
});

module.exports = { loginLimiter, passwordResetLimiter, mailLimiter, apiLimiter };
