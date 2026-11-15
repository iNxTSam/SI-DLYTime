'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';

function readInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    throw new Error(`La variable de entorno ${name} debe ser un número entero.`);
  }
  return value;
}

function readList(name, fallback = []) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  port: readInt('PORT', 3001),

  corsOrigins: readList('CORS_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:3000',
  ]),

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: readInt('DB_PORT', 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dlytime',
    connectionLimit: readInt('DB_CONNECTION_LIMIT', 10),
  },

  mail: {
    user: process.env.MAIL_USER || '',
    appPassword: process.env.MAIL_APP_PASSWORD || '',
    from: process.env.MAIL_FROM || 'SI-DLYTime <no-reply@dlytime.local>',
    supportTo: process.env.SUPPORT_MAIL_TO || process.env.MAIL_USER || '',
  },

  uploads: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxBytes: readInt('UPLOAD_MAX_MB', 10) * 1024 * 1024,
  },

  security: {
    loginMaxAttempts: readInt('LOGIN_MAX_ATTEMPTS', 5),
    loginBlockMinutes: readInt('LOGIN_BLOCK_MINUTES', 10),
    passwordResetTtlMinutes: readInt('PASSWORD_RESET_TTL_MINUTES', 15),
    passwordResetMaxAttempts: readInt('PASSWORD_RESET_MAX_ATTEMPTS', 5),
  },
};

// En produccion no se permite arrancar con un secreto debil o por defecto.
if (isProduction) {
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    throw new Error(
      'JWT_SECRET es obligatorio en produccion y debe tener al menos 32 caracteres.'
    );
  }
}

if (config.jwt.secret && config.jwt.secret.length < 32 && !isProduction) {
  console.warn(
    '[config] JWT_SECRET es corto. En produccion el servidor no arrancara asi.'
  );
}

module.exports = { config };
